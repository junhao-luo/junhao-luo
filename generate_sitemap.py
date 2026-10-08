import os
import xml.etree.ElementTree as ET

BASE_URL = "https://eljhon.me"

def find_html_files(root):
    html_files = []
    excluded_dirs = {
        'graphify-out', 'motion-audits', 'live_captures', 'glass-captures',
        'screenshots', 'test-results', 'playwright-report', 'node_modules',
        '__pycache__', 'env', 'venv',
    }
    excluded_pages = {'404.html', 'thank-you.html', 'ai_orb.html'}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames
                       if not name.startswith('.') and name not in excluded_dirs]
        for f in filenames:
            if f.lower().endswith('.html') and f not in excluded_pages and not f.startswith('test_'):
                rel_path = os.path.relpath(os.path.join(dirpath, f), root)
                html_files.append(rel_path.replace('\\', '/'))
    return sorted(html_files)

def generate_sitemap(html_files):
    urlset = ET.Element('urlset', xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in html_files:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = f"{BASE_URL}/{path}"
    return ET.tostring(urlset, encoding='utf-8', xml_declaration=True).decode('utf-8')

if __name__ == "__main__":
    root_dir = os.path.abspath(os.path.dirname(__file__))
    html_files = find_html_files(root_dir)
    sitemap_content = generate_sitemap(html_files)
    with open(os.path.join(root_dir, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(sitemap_content)
    print(f"Generated sitemap.xml with {len(html_files)} URLs")
