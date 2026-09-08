import os
import ast
import re
from pathlib import Path

PROJECT_ROOT = r"c:\Users\01-135231-091\Desktop\AI Dataset Explorer"
DOCS_DIR = os.path.join(PROJECT_ROOT, "docs", "functions")

def parse_python_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        tree = ast.parse(content)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return []

    functions = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            # skip private/magic methods
            if node.name.startswith('__') and node.name != '__init__':
                continue
                
            name = node.name
            docstring = ast.get_docstring(node) or "No description provided."
            
            args = []
            for arg in node.args.args:
                arg_name = arg.arg
                if arg_name == 'self':
                    continue
                arg_type = "Any"
                if arg.annotation:
                    try:
                        arg_type = ast.unparse(arg.annotation)
                    except:
                        pass
                args.append(f"{arg_name}: {arg_type}")
            
            return_type = "Any"
            if node.returns:
                try:
                    return_type = ast.unparse(node.returns)
                except:
                    pass
            
            functions.append({
                'name': name,
                'args': args,
                'return_type': return_type,
                'docstring': docstring
            })
    return functions

def parse_ts_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return []
        
    functions = []
    
    # Match export function name(args): return_type
    pattern = re.compile(r'(?:/\*\*(.*?)\*/\s*)?export\s+(?:async\s+)?function\s+(\w+)\s*\((.*?)\)(?:\s*:\s*([^{]+))?\s*\{', re.DOTALL)
    for match in pattern.finditer(content):
        docstring = match.group(1)
        if docstring:
            docstring = re.sub(r'^\s*\*\s?', '', docstring, flags=re.MULTILINE).strip()
        else:
            docstring = "No description provided."
            
        name = match.group(2)
        args_raw = match.group(3)
        return_type = match.group(4)
        if return_type:
            return_type = return_type.strip()
        else:
            return_type = "void"
            
        functions.append({
            'name': name,
            'args': [args_raw.strip()] if args_raw.strip() else [],
            'return_type': return_type,
            'docstring': docstring
        })
        
    # Match export const name = (args): return_type =>
    pattern_arrow = re.compile(r'(?:/\*\*(.*?)\*/\s*)?export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\((.*?)\)(?:\s*:\s*([^=]+))?\s*=>\s*(?:\{|[^\{])', re.DOTALL)
    for match in pattern_arrow.finditer(content):
        docstring = match.group(1)
        if docstring:
            docstring = re.sub(r'^\s*\*\s?', '', docstring, flags=re.MULTILINE).strip()
        else:
            docstring = "No description provided."
            
        name = match.group(2)
        args_raw = match.group(3)
        return_type = match.group(4)
        if return_type:
            return_type = return_type.strip()
        else:
            return_type = "void"
            
        functions.append({
            'name': name,
            'args': [args_raw.strip()] if args_raw.strip() else [],
            'return_type': return_type,
            'docstring': docstring
        })
        
    return functions

def create_md_file(output_dir, file_path, func_data, is_backend):
    rel_path = os.path.relpath(file_path, os.path.join(PROJECT_ROOT, "backend", "app") if is_backend else os.path.join(PROJECT_ROOT, "src"))
    base_name = os.path.splitext(rel_path)[0]
    
    dir_path = os.path.join(output_dir, "backend" if is_backend else "frontend", base_name)
    os.makedirs(dir_path, exist_ok=True)
    
    md_path = os.path.join(dir_path, f"{func_data['name']}.md")
    
    rel_file_path = os.path.relpath(file_path, PROJECT_ROOT)
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(f"# {func_data['name']}\n\n")
        f.write(f"**File:** `{rel_file_path}`\n\n")
        f.write(f"## Description\n{func_data['docstring']}\n\n")
        f.write(f"## Signature\n")
        
        args_str = ", ".join(func_data['args'])
        lang = "python" if is_backend else "typescript"
        f.write(f"```{lang}\n")
        if is_backend:
            f.write(f"def {func_data['name']}({args_str}) -> {func_data['return_type']}:\n")
        else:
            f.write(f"function {func_data['name']}({args_str}): {func_data['return_type']}\n")
        f.write(f"```\n")
        
    return md_path

def main():
    print("Starting generation...")
    os.makedirs(DOCS_DIR, exist_ok=True)
    
    index_md = "# Project Functions Index\n\n"
    
    # Process Backend
    backend_dir = os.path.join(PROJECT_ROOT, "backend", "app")
    index_md += "## Backend Functions\n\n"
    for root, _, files in os.walk(backend_dir):
        for file in files:
            if file.endswith(".py") and not file.startswith("__"):
                filepath = os.path.join(root, file)
                funcs = parse_python_file(filepath)
                if funcs:
                    rel_path = os.path.relpath(filepath, backend_dir)
                    index_md += f"### {rel_path}\n"
                    for func in funcs:
                        md_path = create_md_file(DOCS_DIR, filepath, func, is_backend=True)
                        rel_md = os.path.relpath(md_path, DOCS_DIR).replace("\\", "/")
                        index_md += f"- [{func['name']}](./{rel_md})\n"
                    index_md += "\n"
    
    # Process Frontend
    src_dir = os.path.join(PROJECT_ROOT, "src")
    index_md += "## Frontend Functions\n\n"
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith((".ts", ".tsx")) and not file.endswith(".d.ts"):
                filepath = os.path.join(root, file)
                funcs = parse_ts_file(filepath)
                if funcs:
                    rel_path = os.path.relpath(filepath, src_dir)
                    index_md += f"### {rel_path}\n"
                    for func in funcs:
                        md_path = create_md_file(DOCS_DIR, filepath, func, is_backend=False)
                        rel_md = os.path.relpath(md_path, DOCS_DIR).replace("\\", "/")
                        index_md += f"- [{func['name']}](./{rel_md})\n"
                    index_md += "\n"
                    
    # Write Index
    with open(os.path.join(DOCS_DIR, "INDEX.md"), "w", encoding="utf-8") as f:
        f.write(index_md)
        
    print(f"Successfully generated function documentation at {DOCS_DIR}")

if __name__ == "__main__":
    main()
