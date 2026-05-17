#!/usr/bin/env python3
"""SPA-friendly static server for ПодариМомент.
Serves files from this directory; for any non-file path, returns index.html so
deep URLs like /order/gender, /admin, /catalog work with History API routing.
Also maps /des-preview/* to ../../preview/* so design references stay reachable.
"""
import http.server, socketserver, os, sys, pathlib

ROOT = pathlib.Path(__file__).parent.resolve()
DES_ROOT = ROOT.parent.parent  # Des/

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        # Mount /des-preview/* and /des-assets/* from the design folder
        if clean.startswith('/des-preview/'):
            return str(DES_ROOT / 'preview' / clean[len('/des-preview/'):])
        if clean.startswith('/des-assets/'):
            return str(DES_ROOT / 'assets' / clean[len('/des-assets/'):])
        if clean == '/colors_and_type.css':
            return str(DES_ROOT / 'colors_and_type.css')
        return super().translate_path(path)

    def do_GET(self):
        clean = self.path.split('?', 1)[0].split('#', 1)[0]
        fs = self.translate_path(self.path)
        # If it's a directory request, serve normally
        if os.path.isdir(fs):
            return super().do_GET()
        # If file exists, serve it
        if os.path.isfile(fs):
            return super().do_GET()
        # If looks like a static asset (has extension), 404
        if '.' in os.path.basename(clean):
            return super().do_GET()
        # Otherwise fall back to index.html (SPA route)
        self.path = '/index.html'
        return super().do_GET()

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

if __name__ == '__main__':
    os.chdir(ROOT)
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    with socketserver.ThreadingTCPServer(('0.0.0.0', port), Handler) as srv:
        srv.allow_reuse_address = True
        print(f"ПодариМомент — http://localhost:{port}/")
        print(f"  /              landing")
        print(f"  /order         форма заказа")
        print(f"  /order/gender  гендер-пати голос (новое!)")
        print(f"  /order/song    ИИ-песня")
        print(f"  /catalog       каталог работ")
        print(f"  /account       личный кабинет")
        print(f"  /admin         админка (пароль: admin)")
        print(f"  /success       экран успеха")
        print(f"  /des-preview/components-gender.html  design reference")
        srv.serve_forever()
