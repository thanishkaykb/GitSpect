import os
import git
import shutil
import tempfile
import json
import time
from typing import List, Dict
from google import genai
from google.genai import types

class BugAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Initialize Gemini Client
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

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
        if not self.api_key or not self.client:
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
            
            print("[*] Requesting analysis from Gemini API...")
            
            # Simple retry mechanism for quota limitations
            for attempt in range(3):
                try:
                    response = self.client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.1
                        )
                    )
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
