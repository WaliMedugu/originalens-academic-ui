# OriginaLens - Academic Integrity & Originality Studio UI

A pixel-perfect, high-performance web recreation of modern academic originality and AI writing analysis interfaces (inspired by Feedback Studio). Built with vanilla JavaScript, HTML5 Canvas, and modern CSS architecture.

## 🚀 Key Features

- **HTML5 Canvas PDF Viewport**: Multi-page client-side PDF document rendering at 100% vector clarity using PDF.js.
- **DOCX Text & Structure Parser**: Pure client-side Word `.docx` ZIP/XML paragraph decompressor via JSZip.
- **Originality & Similarity Highlight Engine**: Dynamic coordinate matching and source attribution badges (`[1]`, `[2]`, `[3]`).
- **AI Writing Detection Layer**: Per-sentence generative AI probability highlights with confidence thresholds.
- **Feedback Tool Dock**: Right-hand interactive dock for Grades, QuickMarks, Rubrics, Match Overviews, and Submission Details.
- **Multi-Threaded Lightweight Server**: Python `ThreadingMixIn` static server with asset caching.

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Document Engines**: PDF.js (Canvas multi-page rendering), JSZip (Word XML parser)
- **Backend**: Python 3 HTTP Server (Multi-threaded)

## 📦 Getting Started

```bash
# Clone the repository
git clone https://github.com/WaliMedugu/originalens-academic-ui.git

# Navigate to project directory
cd originalens-academic-ui

# Start the local server
python server.py
```

Open `http://localhost:8080/` in your web browser.

## 📄 License

MIT License - Built for educational demonstrations and UI/UX research.
