#!/usr/bin/env python3
"""
🌾 KisanSetu Development Server
- Automatically resolves clean URLs (e.g. /pages/offers/offers -> /pages/offers/offers.html)
- Serves SVG/Favicon automatically
- Zero external dependencies (uses standard Python library)
"""

import http.server
import socketserver
import os
import sys
import mimetypes

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Ensure common web extensions have proper MIME types
mimetypes.init()
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')

class KisanSetuHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def translate_path(self, path):
        # Strip query string and fragment
        clean_path = path.split('?', 1)[0].split('#', 1)[0]

        # Standard resolution relative to root directory
        translated = super().translate_path(clean_path)

        # 1. If the exact file exists, serve it
        if os.path.isfile(translated):
            return translated

        # 2. Check if adding .html finds a file (e.g. /pages/offers/offers -> /pages/offers/offers.html)
        if not clean_path.endswith('/'):
            html_candidate = translated + '.html'
            if os.path.isfile(html_candidate):
                return html_candidate

        # 3. If path is a folder (like /pages/offers or /pages/login)
        if os.path.isdir(translated):
            folder_name = os.path.basename(os.path.normpath(translated))
            same_name_html = os.path.join(translated, f"{folder_name}.html")
            if os.path.isfile(same_name_html):
                return same_name_html
            index_html = os.path.join(translated, "index.html")
            if os.path.isfile(index_html):
                return index_html

        # 4. If directory without trailing slash was requested
        alt_dir = translated + '/'
        if os.path.isdir(alt_dir):
            folder_name = os.path.basename(os.path.normpath(translated))
            same_name_html = os.path.join(translated, f"{folder_name}.html")
            if os.path.isfile(same_name_html):
                return same_name_html

        return translated

    def do_GET(self):
        # Avoid 404 for favicon if missing
        clean_path = self.path.split('?', 1)[0]
        if clean_path == '/favicon.ico' and not os.path.exists(os.path.join(DIRECTORY, 'favicon.ico')):
            self.send_response(204)
            self.end_headers()
            return
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run(port=PORT):
    # Use ThreadingHTTPServer so concurrent requests are served in parallel without blocking
    if hasattr(http.server, 'ThreadingHTTPServer'):
        ServerClass = http.server.ThreadingHTTPServer
    else:
        class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
            allow_reuse_address = True
            daemon_threads = True
        ServerClass = ThreadedServer

    ServerClass.allow_reuse_address = True
    with ServerClass(("", port), KisanSetuHandler) as httpd:
        print(f"\n=======================================================")
        print(f"[KisanSetu] Multi-threaded Server is running!")
        print(f"Website URL: http://localhost:{port}")
        print(f"=======================================================\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == '__main__':
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run(port)
