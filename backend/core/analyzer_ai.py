import os
import git
import shutil
import tempfile
import json
import time
from typing import List, Dict
import google.generativeai as genai

class BugAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = api_key

        print("GEMINI KEY LOADED:", bool(self.api_key))  # debug

        if self.api_key:
            genai.configure(api_key=self.api_key)

    def clone_repo(self, repo_url: str):
        temp_dir = tempfile.mkdtemp()
        try:
            print(f"[*] Cloning {repo_url} to {temp_dir}...")
            git.Repo.clone_from(repo_url, temp_dir, depth=1)
            return temp_dir
        except Exception as e:
            print(f"[!] Clone failed: {str(e)}")
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
            raise e

    def get_important_files(self, repo_path: str):
        important_extensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.go', '.java', '.cpp']
        files_to_scan = []
        for root, dirs, files in os.walk(repo_path):
            if '.git' in dirs:
                dirs.remove('.git')
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            
            for file in files:
                if any(file.endswith(ext) for ext in important_extensions):
                    files_to_scan.append(os.path.join(root, file))
        
        # Limit the number of files to avoid Gemini token limits
        return files_to_scan[:12]

    async def analyze_repo(self, repo_url: str) -> Dict:
        if not self.api_key:
            return {"summary": "Gemini API Key missing.", "bugs": []}
            
        repo_path = self.clone_repo(repo_url)
        try:
            files = self.get_important_files(repo_path)
            all_content = ""
            for file_path in files:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        relative_path = os.path.relpath(file_path, repo_path)
                        # Truncate aggressively to 150 lines to avoid Gemini quota issues
                        lines = f.readlines()
                        content = "".join(lines[:150])
                        all_content += f"\nFILE: {relative_path}\n{content}\n"
                except Exception as fe:
                    print(f"[!] Could not read file {file_path}: {str(fe)}")

            if not all_content:
                return {"summary": "No code files found.", "bugs": []}

            prompt = f"""
            Identify security bugs in this code. Limit to the TOP 3 most critical bugs.
            Return a JSON object exactly matching this structure (do not use markdown formatting tags like ```json):
            {{
                "summary": "overview",
                "bugs": [
                    {{"file": "path", "severity": "High", "title": "...", "description": "...", "mitigation": "..."}}
                ]
            }}

            CODE:
            {all_content}
            """
            
            
            # Simple retry mechanism for quota limitations
            print("[*] Requesting analysis from Gemini API...")
            model = genai.GenerativeModel("gemini-2.5-flash")
            for attempt in range(3):
                try:
                    response = model.generate_content(prompt)
                    text = response.text
                    try:
                        return json.loads(text.strip())
                    except json.JSONDecodeError:
                        print("[!] Did not receive parseable JSON from Gemini, attempting fallback...")
                        return {
                             "summary": text[:200] + "... (JSON parsing failed)",
                             "bugs": []
                        }
                except Exception as api_err:
                    if "429" in str(api_err) or "quota" in str(api_err).lower():
                        print(f"[*] Quota limit hit, retrying in {2 ** attempt} seconds...")
                        time.sleep(2 ** attempt)
                        continue
                    else:
                        raise api_err
            
            raise Exception("Failed after 3 retries due to Gemini API limits.")
                
        except Exception as e:
            print(f"[!] AI logic error: {str(e)}")
            raise e
        finally:
            if os.path.exists(repo_path):
                shutil.rmtree(repo_path, ignore_errors=True)
