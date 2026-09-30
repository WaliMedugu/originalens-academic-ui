import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable caching headers for local assets so reload is instantaneous
        if self.path.endswith(('.js', '.css', '.png', '.jpg')):
            self.send_header('Cache-Control', 'max-age=86400, public')
        super().end_headers()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == "__main__":
    with ThreadedHTTPServer(("", PORT), Handler) as httpd:
        print(f"High-Performance Threaded Server listening on port {PORT}...")
        httpd.serve_forever()
