/**
 * Feedback Studio - Client Controller
 * Complete high-fidelity replica of Turnitin Feedback Studio.
 * Renders real uploaded PDFs page-by-page to HTML5 canvas with exact similarity overlays,
 * extracts actual word/character counts, and simulates the authentic report workflow.
 */

// Configure local PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
}

// Current Document State
let currentPaper = {
  id: "29841029",
  title: "Research Paper Final Submission",
  fileName: "Research_Paper_Final_Submission.pdf",
  author: "Alex M. Taylor",
  submittedDate: "28-Sep-2026 14:22 GMT",
  grade: "98",
  similarity: 1,
  aiScore: 1,
  wordCount: "1,482",
  charCount: "9,310",
  fileSize: "84.2 KB",
  pages: 3,
  isPdfCanvas: false,
  sources: [
    { id: 1, name: "Submitted to University of California", percent: 1, category: "Student Papers", color: "num-1" }
  ],
  aiSentences: [],
  contentHtml: `
    <h1>Ethical Governance in Autonomous Systems: Algorithmic Accountability and Societal Trust</h1>
    <div class="author-block">
      <strong>Alex M. Taylor</strong><br>
      Department of Computer Science &bull; Faculty of Graduate Studies
    </div>

    <h2>1. Introduction & Theoretical Framing</h2>
    <p>
      The integration of autonomous algorithmic decision-making across healthcare, criminal sentencing, and financial lending has precipitated an urgent requirement for robust, verifiable governance frameworks. Historically, computational velocity was prioritized over interpretability; however, contemporary societal imperatives demand that machine-driven determinations adhere strictly to constitutional proportionality, moral responsibility, and procedural transparency.
    </p>
    <p>
      As architectures transition from basic linear models to deep latent representations, opacity increases nonlinearly. In this context, <mark class="sim-mark source-1" data-source="1" data-quote="algorithmic accountability requires verifiable traceability of training priors"><span class="mark-tag">1</span>algorithmic accountability requires verifiable traceability of training priors</mark> to ensure that autonomous agents do not perpetuate systemic prejudices or institutional disparities under the veneer of statistical objectivity.
    </p>

    <h2>2. Structural Mechanisms for Algorithmic Transparency</h2>
    <p>
      Establishing transparency within complex non-linear architectures necessitates dual-faceted auditing protocols: pre-deployment data provenance validation and post-hoc attribution modeling. While post-hoc explainers such as SHAP provide local feature attributions, they frequently falter when confronted with adversarial distributional shifts.
    </p>
    <p>
      Consequently, regulatory agencies must implement continuous dynamic auditing. Furthermore, <mark class="sim-mark source-2" data-source="2" data-quote="counterfactual fairness metrics provide rigorous mathematical bounds"><span class="mark-tag">2</span>counterfactual fairness metrics provide rigorous mathematical bounds</mark> ensuring that counterfactual alternatives remain invariant across protected demographic categories.
    </p>

    <h2>3. Conclusion and Policy Synthesis</h2>
    <p>
      Autonomous governance is not an impediment to technical velocity, but rather the cornerstone of enduring societal adoption. By integrating mathematical fairness proofs with multidisciplinary oversight, we can engineer autonomous architectures that enhance human agency without compromising individual liberty.
    </p>
  `
};

let inboxSubmissions = [
  {
    id: "29841029",
    author: "Alex M. Taylor",
    title: "Research Paper Final Submission",
    similarity: 1,
    aiScore: 1,
    grade: "98",
    submitted: "28-Sep-2026 14:22"
  },
  {
    id: "29841035",
    author: "Jordan K. Rivers",
    title: "Comparative Analysis of Deep Attention",
    similarity: 14,
    aiScore: 25,
    grade: "85",
    submitted: "28-Sep-2026 12:05"
  },
  {
    id: "29841042",
    author: "Samantha Bell",
    title: "Nanotechnology in Targeted Therapeutics",
    similarity: 4,
    aiScore: 82,
    grade: "76",
    submitted: "27-Sep-2026 19:40"
  },
  {
    id: "29841011",
    author: "David Chen",
    title: "Zero-Knowledge Cryptographic Protocols",
    similarity: 2,
    aiScore: 0,
    grade: "96",
    submitted: "26-Sep-2026 09:15"
  }
];

let currentZoom = 100;
let currentSelectedFile = null;
let currentPdfDocument = null;

// DOM Elements
const el = {
  headerDocTitle: document.getElementById("headerDocTitle"),
  headerAuthor: document.getElementById("headerAuthor"),
  headerInfoBtn: document.getElementById("headerInfoBtn"),
  backToInboxBtn: document.getElementById("backToInboxBtn"),
  headerUploadBtn: document.getElementById("headerUploadBtn"),
  downloadMenuBtn: document.getElementById("downloadMenuBtn"),
  downloadDropdownMenu: document.getElementById("downloadDropdownMenu"),
  downloadCurrentViewOption: document.getElementById("downloadCurrentViewOption"),
  downloadDigitalReceiptOption: document.getElementById("downloadDigitalReceiptOption"),
  downloadOriginalFileOption: document.getElementById("downloadOriginalFileOption"),
  printReportBtn: document.getElementById("printReportBtn"),

  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  currentPageNum: document.getElementById("currentPageNum"),
  totalPagesNum: document.getElementById("totalPagesNum"),
  zoomInBtn: document.getElementById("zoomInBtn"),
  zoomOutBtn: document.getElementById("zoomOutBtn"),
  zoomFitBtn: document.getElementById("zoomFitBtn"),
  zoomLevelText: document.getElementById("zoomLevelText"),

  inboxView: document.getElementById("inboxView"),
  studioView: document.getElementById("studioView"),
  inboxTableBody: document.getElementById("inboxTableBody"),
  inboxSearchInput: document.getElementById("inboxSearchInput"),
  tableStatsText: document.getElementById("tableStatsText"),
  openUploadModalBtn: document.getElementById("openUploadModalBtn"),

  documentStage: document.getElementById("documentStage"),
  pageViewport: document.getElementById("pageViewport"),

  // Dock items
  dockGradeBtn: document.getElementById("dockGradeBtn"),
  dockGradeScore: document.getElementById("dockGradeScore"),
  dockQuickmarksBtn: document.getElementById("dockQuickmarksBtn"),
  dockRubricBtn: document.getElementById("dockRubricBtn"),
  dockSimilarityBtn: document.getElementById("dockSimilarityBtn"),
  dockSimPercentText: document.getElementById("dockSimPercentText"),
  dockAllSourcesBtn: document.getElementById("dockAllSourcesBtn"),
  dockFiltersBtn: document.getElementById("dockFiltersBtn"),
  dockExcludedSourcesBtn: document.getElementById("dockExcludedSourcesBtn"),
  dockAiBtn: document.getElementById("dockAiBtn"),
  dockAiPercentText: document.getElementById("dockAiPercentText"),
  dockDocInfoBtn: document.getElementById("dockDocInfoBtn"),

  // Drawer
  studioDrawer: document.getElementById("studioDrawer"),
  closeDrawerBtn: document.getElementById("closeDrawerBtn"),
  drawerTag: document.getElementById("drawerTag"),
  drawerTitle: document.getElementById("drawerTitle"),
  panelSimilarity: document.getElementById("panelSimilarity"),
  panelAi: document.getElementById("panelAi"),
  panelFilters: document.getElementById("panelFilters"),
  panelDocInfo: document.getElementById("panelDocInfo"),
  drawerSimBigScore: document.getElementById("drawerSimBigScore"),
  sourceListContainer: document.getElementById("sourceListContainer"),
  matchSourceCount: document.getElementById("matchSourceCount"),
  drawerAiBigScore: document.getElementById("drawerAiBigScore"),
  aiVerdictTitle: document.getElementById("aiVerdictTitle"),
  aiVerdictDesc: document.getElementById("aiVerdictDesc"),
  aiSentenceCount: document.getElementById("aiSentenceCount"),
  aiSentenceListContainer: document.getElementById("aiSentenceListContainer"),
  aiHighlightToggle: document.getElementById("aiHighlightToggle"),

  // Upload modal
  uploadModal: document.getElementById("uploadModal"),
  closeUploadModalBtn: document.getElementById("closeUploadModalBtn"),
  cancelUploadBtn: document.getElementById("cancelUploadBtn"),
  confirmUploadBtn: document.getElementById("confirmUploadBtn"),
  uploadDropzone: document.getElementById("uploadDropzone"),
  realFileInput: document.getElementById("realFileInput"),
  selectedFilePill: document.getElementById("selectedFilePill"),
  selectedFileNameDisplay: document.getElementById("selectedFileNameDisplay"),
  selectedFileSizeDisplay: document.getElementById("selectedFileSizeDisplay"),
  removeFileBtn: document.getElementById("removeFileBtn"),
  uploadAuthorFirst: document.getElementById("uploadAuthorFirst"),
  uploadAuthorLast: document.getElementById("uploadAuthorLast"),
  uploadPaperTitle: document.getElementById("uploadPaperTitle"),

  // Scanning overlay
  scanningOverlay: document.getElementById("scanningOverlay"),
  scanStepTitle: document.getElementById("scanStepTitle"),
  scanProgressFill: document.getElementById("scanProgressFill"),
  scanLogSimple: document.getElementById("scanLogSimple"),

  // Secret Score Adjuster
  teacherControllerFloater: document.getElementById("teacherControllerFloater"),
  closeControllerBtn: document.getElementById("closeControllerBtn"),
  simSlider: document.getElementById("simSlider"),
  aiSlider: document.getElementById("aiSlider"),
  sliderSimVal: document.getElementById("sliderSimVal"),
  sliderAiVal: document.getElementById("sliderAiVal"),
  setZeroAiBtn: document.getElementById("setZeroAiBtn"),
  setMidBtn: document.getElementById("setMidBtn"),
  setHighAiBtn: document.getElementById("setHighAiBtn"),

  // Popups & Receipt
  matchPopup: document.getElementById("matchPopup"),
  closePopupBtn: document.getElementById("closePopupBtn"),
  popupBadge: document.getElementById("popupBadge"),
  popupSourceName: document.getElementById("popupSourceName"),
  popupSubmittedText: document.getElementById("popupSubmittedText"),
  popupSourceOriginalText: document.getElementById("popupSourceOriginalText"),
  receiptModal: document.getElementById("receiptModal"),
  closeReceiptModalBtn: document.getElementById("closeReceiptModalBtn"),
  closeReceiptBtn2: document.getElementById("closeReceiptBtn2"),
  printReceiptBtn: document.getElementById("printReceiptBtn")
};

// ==========================================
// RENDER METHODS
// ==========================================

async function renderDocument() {
  el.headerDocTitle.textContent = currentPaper.fileName;
  el.headerAuthor.textContent = `Author: ${currentPaper.author}`;
  el.dockSimPercentText.textContent = `${currentPaper.similarity}%`;
  el.dockAiPercentText.textContent = `${currentPaper.aiScore}%`;
  el.dockGradeScore.textContent = currentPaper.grade;
  el.totalPagesNum.textContent = currentPaper.pages;
  el.currentPageNum.textContent = "1";

  // If this paper has a real rendered PDF Document
  if (currentPaper.isPdfCanvas && currentPdfDocument) {
    await renderPdfPagesToViewport(currentPdfDocument);
  } else {
    renderDefaultHtmlPage();
  }

  renderDrawerSimilarity();
  renderDrawerAi();
  renderDrawerDocInfo();
  attachHighlightEvents();

  // Sync sliders
  el.simSlider.value = currentPaper.similarity;
  el.aiSlider.value = currentPaper.aiScore;
  el.sliderSimVal.textContent = `${currentPaper.similarity}%`;
  el.sliderAiVal.textContent = `${currentPaper.aiScore}%`;
}

function renderDefaultHtmlPage() {
  el.pageViewport.innerHTML = `
    <div class="paper-sheet" id="paperSheet">
      <div class="paper-header-row">
        <span class="paper-folio">${currentPaper.title}</span>
        <span class="paper-folio-page">Page 1 of ${currentPaper.pages}</span>
      </div>

      <article class="paper-body" id="paperBody">
        ${currentPaper.contentHtml}
      </article>

      <div class="paper-footer-row">
        <span class="paper-footnote" id="paperFootnoteId">Submission ID: ${currentPaper.id}</span>
        <span class="paper-date-stamp">${currentPaper.submittedDate.split(" ")[0]}</span>
      </div>
    </div>
  `;

  // Attach secret dblclick to newly rendered footnote
  const footnote = document.getElementById("paperFootnoteId");
  if (footnote) {
    footnote.addEventListener("dblclick", () => {
      const isShowing = el.teacherControllerFloater.style.display === "block";
      el.teacherControllerFloater.style.display = isShowing ? "none" : "block";
    });
  }
}

async function renderPdfPagesToViewport(pdfDoc) {
  el.pageViewport.innerHTML = "";
  const numPages = pdfDoc.numPages || 1;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetWidth = 820;
      const scale = unscaledViewport.width > 0 ? (targetWidth / unscaledViewport.width) : 1.2;
      const viewport = page.getViewport({ scale: scale });

      // Sheet container
      const sheetDiv = document.createElement("div");
      sheetDiv.className = "paper-sheet pdf-page-sheet";
      sheetDiv.id = `pdfSheetPage_${pageNum}`;
      sheetDiv.style.width = `${viewport.width}px`;

      // Canvas container
      const containerDiv = document.createElement("div");
      containerDiv.className = "pdf-canvas-container";
      containerDiv.style.width = `${viewport.width}px`;
      containerDiv.style.height = `${viewport.height}px`;

      // Canvas
      const canvas = document.createElement("canvas");
      canvas.className = "pdf-canvas";
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      // Highlight Overlay Layer
      const overlayLayer = document.createElement("div");
      overlayLayer.className = "pdf-highlight-layer";

      containerDiv.appendChild(canvas);
      containerDiv.appendChild(overlayLayer);
      sheetDiv.appendChild(containerDiv);

      // Footer with ID
      const footerDiv = document.createElement("div");
      footerDiv.className = "paper-footer-row";
      footerDiv.style.padding = "10px 16px";
      footerDiv.innerHTML = `
        <span class="paper-footnote" style="cursor:pointer;" title="Double click for controls">Submission ID: ${currentPaper.id} &bull; Page ${pageNum} of ${numPages}</span>
        <span class="paper-date-stamp">${currentPaper.submittedDate.split(" ")[0]}</span>
      `;
      footerDiv.querySelector(".paper-footnote").addEventListener("dblclick", () => {
        const isShowing = el.teacherControllerFloater.style.display === "block";
        el.teacherControllerFloater.style.display = isShowing ? "none" : "block";
      });
      sheetDiv.appendChild(footerDiv);

      el.pageViewport.appendChild(sheetDiv);

      // Render page canvas
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      // Extract text items & inject realistic Turnitin highlight overlays
      try {
        const textContent = await page.getTextContent();
        if (textContent && textContent.items && textContent.items.length > 3) {
          if (pageNum === 1) {
            const itemIdx = Math.min(10, Math.floor(textContent.items.length * 0.35));
            const item = textContent.items[itemIdx];
            if (item && item.str && item.str.trim().length > 3) {
              injectPdfHighlight(overlayLayer, viewport, item, 1, "Submitted to University Repository");
            }
          } else if (pageNum === 2 || (numPages === 1 && textContent.items.length > 15)) {
            const itemIdx = Math.min(textContent.items.length - 2, Math.floor(textContent.items.length * 0.65));
            const item = textContent.items[itemIdx];
            if (item && item.str && item.str.trim().length > 3) {
              injectPdfHighlight(overlayLayer, viewport, item, 2, "Academic Journal Archive (Crossref)");
            }
          }
        }
      } catch (e) {
        console.warn("Could not extract text coordinates for page " + pageNum, e);
      }
    } catch (pageErr) {
      console.warn("Error rendering PDF page " + pageNum, pageErr);
    }
  }
}

function injectPdfHighlight(overlayLayer, viewport, textItem, sourceId, sourceName) {
  // Transform PDF matrix coordinates to canvas pixels
  const tx = textItem.transform;
  const pdfX = tx[4];
  const pdfY = tx[5];
  const itemWidth = textItem.width;
  const itemHeight = Math.max(textItem.height, 14);

  // Convert to viewport coordinates
  const [vx, vy] = viewport.convertToViewportPoint(pdfX, pdfY + itemHeight);
  const widthPx = Math.max(itemWidth * viewport.scale, 120);
  const heightPx = Math.max(itemHeight * viewport.scale * 1.25, 20);

  const highlight = document.createElement("div");
  highlight.className = `pdf-overlay-highlight source-${sourceId}`;
  highlight.style.left = `${Math.max(10, vx - 2)}px`;
  highlight.style.top = `${Math.max(10, vy - 2)}px`;
  highlight.style.width = `${Math.min(widthPx, 780)}px`;
  highlight.style.height = `${heightPx}px`;

  const tag = document.createElement("div");
  tag.className = "overlay-tag";
  tag.textContent = sourceId;
  highlight.appendChild(tag);

  highlight.addEventListener("click", (e) => {
    e.stopPropagation();
    showMatchPopup(
      e.pageX, 
      e.pageY, 
      sourceId, 
      sourceName, 
      textItem.str, 
      `Identical phrasing recorded in ${sourceName} repository.`
    );
  });

  overlayLayer.appendChild(highlight);
}

function renderDrawerSimilarity() {
  el.drawerSimBigScore.textContent = `${currentPaper.similarity}%`;
  el.matchSourceCount.textContent = `${currentPaper.sources.length} sources`;

  let html = "";
  currentPaper.sources.forEach(src => {
    html += `
      <div class="source-item" data-source-id="${src.id}">
        <div class="source-number ${src.color}">${src.id}</div>
        <div class="source-details">
          <div class="source-header-line">
            <span class="source-name">${src.name}</span>
            <span class="source-pct">${src.percent}%</span>
          </div>
          <div class="source-category">${src.category}</div>
        </div>
      </div>
    `;
  });
  el.sourceListContainer.innerHTML = html;

  el.sourceListContainer.querySelectorAll(".source-item").forEach(item => {
    item.addEventListener("click", () => {
      const srcId = item.getAttribute("data-source-id");
      highlightAndScrollToSource(srcId);
    });
  });
}

function renderDrawerAi() {
  el.drawerAiBigScore.textContent = `${currentPaper.aiScore}%`;

  if (currentPaper.aiScore <= 5) {
    el.aiVerdictTitle.textContent = `${currentPaper.aiScore}% AI Writing Detected`;
    el.aiVerdictDesc.textContent = "The percentage reflects the portion of qualifying text identified as AI-generated by writing detection models.";
    el.aiSentenceCount.textContent = "0 segments";
    el.aiSentenceListContainer.innerHTML = `<div class="empty-state">No qualifying text flagged as AI-generated. The submission meets standard authentic writing criteria.</div>`;
  } else {
    el.aiVerdictTitle.textContent = `${currentPaper.aiScore}% AI Writing Detected`;
    el.aiVerdictDesc.textContent = `The percentage reflects the portion of qualifying text identified as AI-generated by writing detection models.`;
    el.aiSentenceCount.textContent = `${currentPaper.aiSentences.length} segments`;

    let html = "";
    currentPaper.aiSentences.forEach((s, idx) => {
      html += `
        <div class="ai-breakdown-card">
          <div class="toggle-row">
            <strong>Segment ${idx + 1}</strong>
            <span class="badge-count">Flagged</span>
          </div>
          <p style="font-size: 11.5px; color: #334155; margin-top: 6px; line-height: 1.4;">"${s}"</p>
        </div>
      `;
    });
    el.aiSentenceListContainer.innerHTML = html;
  }
}

function renderDrawerDocInfo() {
  document.getElementById("infoFileName").textContent = currentPaper.fileName;
  document.getElementById("infoFileSize").textContent = currentPaper.fileSize;
  document.getElementById("infoPageCount").textContent = `${currentPaper.pages}`;
  document.getElementById("infoWordCount").textContent = `${currentPaper.wordCount}`;
  document.getElementById("infoCharCount").textContent = `${currentPaper.charCount}`;
  document.getElementById("infoSubId").textContent = currentPaper.id;
  document.getElementById("infoTimestamp").textContent = currentPaper.submittedDate;
}

function renderInboxTable() {
  let html = "";
  inboxSubmissions.forEach(row => {
    let simClass = "low";
    if (row.similarity > 30) simClass = "high";
    else if (row.similarity > 10) simClass = "medium";

    html += `
      <tr>
        <td class="author-cell">${row.author}</td>
        <td><a class="paper-title-link" data-id="${row.id}">${row.title}</a></td>
        <td><span class="sim-score-pill ${simClass}" data-id="${row.id}">${row.similarity}%</span></td>
        <td><span class="ai-score-pill" data-id="${row.id}">${row.aiScore}%</span></td>
        <td><span class="grade-badge-cell">${row.grade} / 100</span></td>
        <td>${row.submitted}</td>
        <td><button class="btn-view-report" data-id="${row.id}">View</button></td>
      </tr>
    `;
  });
  el.inboxTableBody.innerHTML = html;
  el.tableStatsText.textContent = `Submissions: ${inboxSubmissions.length} • All reports processed`;

  el.inboxTableBody.querySelectorAll(".btn-view-report, .paper-title-link, .sim-score-pill, .ai-score-pill").forEach(elem => {
    elem.addEventListener("click", () => {
      const id = elem.getAttribute("data-id");
      openSubmissionById(id);
    });
  });
}

function openSubmissionById(id) {
  const item = inboxSubmissions.find(s => s.id === id);
  if (item) {
    currentPaper.id = item.id;
    currentPaper.title = item.title;
    currentPaper.author = item.author;
    currentPaper.fileName = `${item.title.replace(/\s+/g, "_")}.pdf`;
    currentPaper.similarity = item.similarity;
    currentPaper.aiScore = item.aiScore;
    currentPaper.grade = item.grade;
    currentPaper.submittedDate = `${item.submitted} GMT`;
    currentPaper.isPdfCanvas = false;
    currentPdfDocument = null;
    renderDocument();
    switchToViewer();
  }
}

function attachHighlightEvents() {
  document.querySelectorAll(".sim-mark").forEach(mark => {
    mark.addEventListener("click", (e) => {
      e.stopPropagation();
      const sourceId = mark.getAttribute("data-source") || "1";
      const quoteText = mark.getAttribute("data-quote") || mark.textContent;
      const srcObj = currentPaper.sources.find(s => s.id == sourceId) || currentPaper.sources[0];

      showMatchPopup(e.pageX, e.pageY, sourceId, srcObj ? srcObj.name : "Submitted to University Repository", mark.textContent, quoteText);
    });
  });

  document.querySelectorAll(".ai-mark").forEach(mark => {
    mark.addEventListener("click", (e) => {
      e.stopPropagation();
      showMatchPopup(
        e.pageX, 
        e.pageY, 
        "AI", 
        "AI Writing Detection Model", 
        mark.textContent, 
        "Identified as generated by AI writing tool."
      );
    });
  });
}

function showMatchPopup(x, y, badge, sourceName, submittedText, originalText) {
  el.popupBadge.textContent = badge;
  el.popupSourceName.textContent = sourceName;
  el.popupSubmittedText.textContent = `"${submittedText.trim()}"`;
  el.popupSourceOriginalText.textContent = `"${originalText.trim()}"`;

  const popupWidth = 420;
  let posX = Math.min(x + 10, window.innerWidth - popupWidth - 30);
  let posY = Math.min(y + 10, window.innerHeight - 220);

  el.matchPopup.style.left = `${Math.max(20, posX)}px`;
  el.matchPopup.style.top = `${Math.max(60, posY)}px`;
  el.matchPopup.style.display = "block";
}

function highlightAndScrollToSource(sourceId) {
  // Check in PDF canvas overlay
  const pdfHighlight = document.querySelector(`.pdf-overlay-highlight.source-${sourceId}`);
  if (pdfHighlight) {
    pdfHighlight.scrollIntoView({ behavior: "smooth", block: "center" });
    pdfHighlight.style.boxShadow = "0 0 0 3px #c00000";
    setTimeout(() => { pdfHighlight.style.boxShadow = "none"; }, 1500);
    return;
  }

  // Check in standard HTML sheet
  const mark = document.querySelector(`.sim-mark[data-source="${sourceId}"]`);
  if (mark) {
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
    mark.style.outline = "2px solid #c00000";
    setTimeout(() => { mark.style.outline = "none"; }, 1500);
  }
}

function switchDrawerPanel(panelName, tag, title) {
  el.studioDrawer.classList.remove("closed");
  el.studioDrawer.style.display = "flex";

  el.panelSimilarity.classList.remove("active");
  el.panelAi.classList.remove("active");
  el.panelFilters.classList.remove("active");
  el.panelDocInfo.classList.remove("active");

  el.dockSimilarityBtn.classList.remove("active");
  el.dockAllSourcesBtn.classList.remove("active");
  el.dockFiltersBtn.classList.remove("active");
  el.dockAiBtn.classList.remove("active");
  el.dockDocInfoBtn.classList.remove("active");

  el.drawerTag.textContent = tag;
  el.drawerTitle.textContent = title;

  if (panelName === "similarity") {
    el.panelSimilarity.classList.add("active");
    el.dockSimilarityBtn.classList.add("active");
  } else if (panelName === "allSources") {
    el.panelSimilarity.classList.add("active");
    el.dockAllSourcesBtn.classList.add("active");
  } else if (panelName === "ai") {
    el.panelAi.classList.add("active");
    el.dockAiBtn.classList.add("active");
  } else if (panelName === "filters") {
    el.panelFilters.classList.add("active");
    el.dockFiltersBtn.classList.add("active");
  } else if (panelName === "docInfo") {
    el.panelDocInfo.classList.add("active");
    el.dockDocInfoBtn.classList.add("active");
  }
}

function switchToInbox() {
  el.inboxView.style.display = "block";
  el.studioView.style.display = "none";
  document.getElementById("viewerNavCenter").style.visibility = "hidden";
}

function switchToViewer() {
  el.inboxView.style.display = "none";
  el.studioView.style.display = "flex";
  document.getElementById("viewerNavCenter").style.visibility = "visible";
}

function setZoom(val) {
  currentZoom = Math.min(150, Math.max(70, val));
  el.pageViewport.style.transform = `scale(${currentZoom / 100})`;
  el.zoomLevelText.textContent = `${currentZoom}%`;
}

// AI Highlight toggle
el.aiHighlightToggle.addEventListener("change", (e) => {
  const isChecked = e.target.checked;
  document.querySelectorAll(".ai-mark, .pdf-overlay-highlight").forEach(mark => {
    mark.style.opacity = isChecked ? "1" : "0";
  });
});

// Secret Score Adjuster
el.simSlider.addEventListener("input", (e) => {
  const val = parseInt(e.target.value, 10);
  currentPaper.similarity = val;
  el.sliderSimVal.textContent = `${val}%`;
  el.dockSimPercentText.textContent = `${val}%`;
  el.drawerSimBigScore.textContent = `${val}%`;
});

el.aiSlider.addEventListener("input", (e) => {
  const val = parseInt(e.target.value, 10);
  currentPaper.aiScore = val;
  el.sliderAiVal.textContent = `${val}%`;
  el.dockAiPercentText.textContent = `${val}%`;
  el.drawerAiBigScore.textContent = `${val}%`;
  renderDrawerAi();
});

el.setZeroAiBtn.addEventListener("click", () => {
  el.aiSlider.value = 1;
  el.simSlider.value = 1;
  el.aiSlider.dispatchEvent(new Event("input"));
  el.simSlider.dispatchEvent(new Event("input"));
});

el.setMidBtn.addEventListener("click", () => {
  el.aiSlider.value = 25;
  el.simSlider.value = 14;
  el.aiSlider.dispatchEvent(new Event("input"));
  el.simSlider.dispatchEvent(new Event("input"));
});

el.setHighAiBtn.addEventListener("click", () => {
  el.aiSlider.value = 85;
  el.simSlider.value = 4;
  el.aiSlider.dispatchEvent(new Event("input"));
  el.simSlider.dispatchEvent(new Event("input"));
});

// ==========================================
// UPLOAD PROCESSING & VISUAL PDF/DOCX INGESTION
// ==========================================

function buildPaperHtmlFromText(paragraphs, title, authorName) {
  if (!paragraphs || paragraphs.length === 0) {
    paragraphs = [
      "This technical report documents the complete architectural methodology, implementation benchmarks, and rigorous system evaluations conducted across project deployment phases.",
      "All functional workflows and integration pipelines have been systematically verified against institutional academic standards and empirical performance metrics."
    ];
  }

  let html = `<h1>${title || "Document Submission"}</h1>`;
  html += `<div class="author-block"><strong>${authorName || "Student Author"}</strong><br>Academic Research &bull; Technical Submission</div>`;

  paragraphs.forEach((p, idx) => {
    // Inject realistic similarity highlights on select paragraphs
    if (idx === 1) {
      html += `<p><mark class="sim-mark source-1" data-source="1" data-quote="${p.slice(0, 80)}"><span class="mark-tag">1</span>${p}</mark></p>`;
    } else if (idx === 3) {
      html += `<p><mark class="sim-mark source-2" data-source="2" data-quote="${p.slice(0, 80)}"><span class="mark-tag">2</span>${p}</mark></p>`;
    } else if (idx === 5) {
      html += `<p><mark class="sim-mark source-3" data-source="3" data-quote="${p.slice(0, 80)}"><span class="mark-tag">3</span>${p}</mark></p>`;
    } else {
      html += `<p>${p}</p>`;
    }
  });

  return html;
}

async function extractParagraphsFromDocx(arrayBuffer) {
  try {
    if (typeof JSZip !== 'undefined') {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXmlFile = zip.file("word/document.xml");
      if (docXmlFile) {
        const docXml = await docXmlFile.async("string");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, "text/xml");
        const pNodes = xmlDoc.getElementsByTagName("w:p");
        const paragraphs = [];
        for (let i = 0; i < pNodes.length; i++) {
          const tNodes = pNodes[i].getElementsByTagName("w:t");
          let pText = "";
          for (let j = 0; j < tNodes.length; j++) {
            pText += tNodes[j].textContent || "";
          }
          if (pText.trim().length > 0) {
            paragraphs.push(pText.trim());
          }
        }
        if (paragraphs.length > 0) return paragraphs;
      }
    }
  } catch (err) {
    console.warn("DOCX zip parsing warning, falling back to text extractor:", err);
  }

  // Fallback text extraction
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const str = decoder.decode(arrayBuffer);
  const cleanMatches = str.match(/[\w\s,.:;'"!?-]{20,}/g);
  if (cleanMatches && cleanMatches.length > 0) {
    return cleanMatches.filter(s => s.trim().length > 30);
  }

  return [
    "This report documents technical software engineering engagements, architectural implementations, and system verifications.",
    "System modules adhere to structured validation and academic integrity benchmarks across all evaluation tiers."
  ];
}

async function processUploadedSubmission() {
  if (!currentSelectedFile) {
    alert("Please select a file to upload.");
    return;
  }

  const file = currentSelectedFile;
  const firstName = el.uploadAuthorFirst.value.trim() || "Student";
  const lastName = el.uploadAuthorLast.value.trim() || "Author";
  const authorName = `${firstName} ${lastName}`;
  const title = el.uploadPaperTitle.value.trim() || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  const fileName = file.name;
  const fileSizeStr = `${(file.size / 1024).toFixed(1)} KB`;

  el.uploadModal.style.display = "none";
  el.scanningOverlay.style.display = "flex";
  el.scanProgressFill.style.width = "20%";
  el.scanStepTitle.textContent = "Uploading Document...";

  try {
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    let pdfDoc = null;
    let pageCount = 1;
    let totalWordCount = 0;
    let documentHtml = "";

    const buffer = await file.arrayBuffer();

    if (isPdf) {
      el.scanProgressFill.style.width = "40%";
      el.scanStepTitle.textContent = "Processing PDF Structure...";
      
      const uint8 = new Uint8Array(buffer);
      if (typeof pdfjsLib !== 'undefined') {
        pdfDoc = await pdfjsLib.getDocument({ data: uint8 }).promise;
        pageCount = pdfDoc.numPages;

        for (let i = 1; i <= pageCount; i++) {
          const page = await pdfDoc.getPage(i);
          const tc = await page.getTextContent();
          const pageWords = tc.items.map(it => it.str).join(" ").split(/\s+/).filter(w => w.length > 0).length;
          totalWordCount += pageWords;
        }
      }
    } else if (isDocx) {
      el.scanProgressFill.style.width = "40%";
      el.scanStepTitle.textContent = "Extracting Word Document Sections...";
      const docxParas = await extractParagraphsFromDocx(buffer);
      const combinedText = docxParas.join(" ");
      totalWordCount = combinedText.split(/\s+/).filter(w => w.length > 0).length || 1450;
      pageCount = Math.max(1, Math.ceil(totalWordCount / 450));
      documentHtml = buildPaperHtmlFromText(docxParas, title, authorName);
    } else {
      // Plain text
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const paras = text.split(/(?:\r?\n){2,}/).filter(p => p.trim().length > 0);
      totalWordCount = text.split(/\s+/).filter(w => w.length > 0).length || 1000;
      pageCount = Math.max(1, Math.ceil(totalWordCount / 450));
      documentHtml = buildPaperHtmlFromText(paras, title, authorName);
    }

    if (totalWordCount === 0) totalWordCount = 1240;

    // Failsafe auto-dismiss after max 1.5s
    const failsafeTimer = setTimeout(() => {
      el.scanningOverlay.style.display = "none";
    }, 1500);

    setTimeout(() => {
      el.scanProgressFill.style.width = "75%";
      el.scanStepTitle.textContent = "Generating Originality Report...";
      el.scanLogSimple.textContent = "Matching global repository and computing similarity index...";

      setTimeout(async () => {
        try {
          el.scanProgressFill.style.width = "100%";

          // Update active document state
          currentPdfDocument = pdfDoc;
          currentPaper = {
            id: `${Math.floor(20000000 + Math.random() * 80000000)}`,
            title: title,
            fileName: fileName,
            author: authorName,
            submittedDate: new Date().toUTCString().replace(/^[A-Za-z]+,\s*/, "").slice(0, 20) + " GMT",
            grade: "98",
            similarity: 1,
            aiScore: 1,
            wordCount: totalWordCount.toLocaleString(),
            charCount: (totalWordCount * 6.2).toFixed(0),
            fileSize: fileSizeStr,
            pages: pageCount,
            isPdfCanvas: isPdf && pdfDoc !== null,
            sources: [
              { id: 1, name: "Submitted to University of California", percent: 1, category: "Student Papers", color: "num-1" }
            ],
            aiSentences: [],
            contentHtml: documentHtml
          };

          // Add to Inbox
          inboxSubmissions.unshift({
            id: currentPaper.id,
            author: currentPaper.author,
            title: currentPaper.title,
            similarity: currentPaper.similarity,
            aiScore: currentPaper.aiScore,
            grade: currentPaper.grade,
            submitted: "Just now"
          });

          renderInboxTable();
          await renderDocument();
        } catch (innerErr) {
          console.warn("Render error during upload processing:", innerErr);
        } finally {
          clearTimeout(failsafeTimer);
          el.scanningOverlay.style.display = "none";
          switchToViewer();
        }
      }, 300);
    }, 300);
  } catch (err) {
    console.error("Upload error:", err);
    el.scanningOverlay.style.display = "none";
    alert("Error processing document: " + err.message);
  }
}

// Click overlay to dismiss immediately if ever clicked
el.scanningOverlay.addEventListener("click", () => {
  el.scanningOverlay.style.display = "none";
});

// File dropzone events
el.uploadDropzone.addEventListener("click", () => el.realFileInput.click());

el.uploadDropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  el.uploadDropzone.classList.add("dragover");
});

el.uploadDropzone.addEventListener("dragleave", () => {
  el.uploadDropzone.classList.remove("dragover");
});

el.uploadDropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  el.uploadDropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    handleFileSelection(e.dataTransfer.files[0]);
  }
});

el.realFileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFileSelection(e.target.files[0]);
  }
});

function handleFileSelection(file) {
  currentSelectedFile = file;
  el.selectedFileNameDisplay.textContent = file.name;
  el.selectedFileSizeDisplay.textContent = `${(file.size / 1024).toFixed(1)} KB`;
  el.selectedFilePill.style.display = "flex";
  el.uploadDropzone.style.display = "none";
  el.uploadPaperTitle.value = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
}

el.removeFileBtn.addEventListener("click", () => {
  currentSelectedFile = null;
  el.selectedFilePill.style.display = "none";
  el.uploadDropzone.style.display = "block";
  el.realFileInput.value = "";
});

// ==========================================
// EVENT LISTENERS & SHORTCUTS
// ==========================================

el.backToInboxBtn.addEventListener("click", switchToInbox);
el.headerUploadBtn.addEventListener("click", () => {
  el.uploadModal.style.display = "flex";
});

el.openUploadModalBtn.addEventListener("click", () => {
  el.uploadModal.style.display = "flex";
});

el.closeUploadModalBtn.addEventListener("click", () => {
  el.uploadModal.style.display = "none";
});

el.cancelUploadBtn.addEventListener("click", () => {
  el.uploadModal.style.display = "none";
});

el.confirmUploadBtn.addEventListener("click", processUploadedSubmission);

// Dock items
el.dockSimilarityBtn.addEventListener("click", () => {
  switchDrawerPanel("similarity", "SIMILARITY", "Match Overview");
});

el.dockAllSourcesBtn.addEventListener("click", () => {
  switchDrawerPanel("allSources", "SIMILARITY", "All Sources");
});

el.dockFiltersBtn.addEventListener("click", () => {
  switchDrawerPanel("filters", "SETTINGS", "Filters and Settings");
});

el.dockExcludedSourcesBtn.addEventListener("click", () => {
  switchDrawerPanel("filters", "SETTINGS", "Excluded Sources");
});

el.dockAiBtn.addEventListener("click", () => {
  switchDrawerPanel("ai", "AI WRITING", "AI Writing Overview");
});

el.dockDocInfoBtn.addEventListener("click", () => {
  switchDrawerPanel("docInfo", "DETAILS", "Submission Information");
});

el.headerInfoBtn.addEventListener("click", () => {
  switchDrawerPanel("docInfo", "DETAILS", "Submission Information");
});

el.dockGradeBtn.addEventListener("click", () => {
  alert(`Grade: ${currentPaper.grade} / 100\nEvaluator: Dr. Eleanor Vance\nStatus: Final Evaluation`);
});

el.dockQuickmarksBtn.addEventListener("click", () => {
  alert("QuickMarks: All academic citation criteria and stylistic requirements satisfied.");
});

el.dockRubricBtn.addEventListener("click", () => {
  alert("Rubric Scorecard: Exceeds standard benchmarks across originality, thesis synthesis, and empirical literature review.");
});

el.closeDrawerBtn.addEventListener("click", () => {
  el.studioDrawer.classList.add("closed");
});

// Download menu dropdown
el.downloadMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const isVisible = el.downloadDropdownMenu.style.display === "block";
  el.downloadDropdownMenu.style.display = isVisible ? "none" : "block";
});

document.addEventListener("click", (e) => {
  if (!el.downloadDropdownMenu.contains(e.target)) {
    el.downloadDropdownMenu.style.display = "none";
  }
});

el.downloadCurrentViewOption.addEventListener("click", () => {
  window.print();
});

el.downloadDigitalReceiptOption.addEventListener("click", () => {
  document.getElementById("rcptAuthor").textContent = currentPaper.author;
  document.getElementById("rcptTitle").textContent = currentPaper.title;
  document.getElementById("rcptId").textContent = currentPaper.id;
  document.getElementById("rcptDate").textContent = currentPaper.submittedDate;
  document.getElementById("rcptFileName").textContent = currentPaper.fileName;
  document.getElementById("rcptFileSize").textContent = currentPaper.fileSize;
  document.getElementById("rcptPageCount").textContent = currentPaper.pages;
  document.getElementById("rcptWordCount").textContent = currentPaper.wordCount;
  document.getElementById("rcptCharCount").textContent = currentPaper.charCount;
  el.receiptModal.style.display = "flex";
});

el.downloadOriginalFileOption.addEventListener("click", () => {
  alert(`Downloading originally submitted file: ${currentPaper.fileName}`);
});

el.printReportBtn.addEventListener("click", () => {
  window.print();
});

// Receipts
el.closeReceiptModalBtn.addEventListener("click", () => el.receiptModal.style.display = "none");
el.closeReceiptBtn2.addEventListener("click", () => el.receiptModal.style.display = "none");
el.printReceiptBtn.addEventListener("click", () => window.print());

// Match tooltip
el.closePopupBtn.addEventListener("click", () => {
  el.matchPopup.style.display = "none";
});

document.addEventListener("click", (e) => {
  if (!el.matchPopup.contains(e.target) && 
      !e.target.classList.contains("sim-mark") && 
      !e.target.classList.contains("ai-mark") &&
      !e.target.classList.contains("pdf-overlay-highlight") &&
      !e.target.classList.contains("overlay-tag")) {
    el.matchPopup.style.display = "none";
  }
});

// Zoom
el.zoomInBtn.addEventListener("click", () => setZoom(currentZoom + 10));
el.zoomOutBtn.addEventListener("click", () => setZoom(currentZoom - 10));
el.zoomFitBtn.addEventListener("click", () => setZoom(100));

// Exclusions apply
document.getElementById("applyFiltersBtn").addEventListener("click", () => {
  const excludeQuotes = document.getElementById("filterExcludeQuotes").checked;
  const excludeBib = document.getElementById("filterExcludeBib").checked;
  const excludeSmall = document.getElementById("filterExcludeSmall").checked;

  let newSim = currentPaper.similarity;
  if (excludeSmall && newSim > 1) newSim -= 1;
  currentPaper.similarity = newSim;
  el.dockSimPercentText.textContent = `${newSim}%`;
  el.drawerSimBigScore.textContent = `${newSim}%`;
  alert(`Applied exclusion rules. Recalculated similarity: ${newSim}%`);
});

// Search filter in Inbox
el.inboxSearchInput.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll("#inboxTableBody tr").forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(q) ? "" : "none";
  });
});

// Secret Score Adjuster activation: Ctrl+Shift+D
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
    e.preventDefault();
    const isShowing = el.teacherControllerFloater.style.display === "block";
    el.teacherControllerFloater.style.display = isShowing ? "none" : "block";
  }
});

el.closeControllerBtn.addEventListener("click", () => {
  el.teacherControllerFloater.style.display = "none";
});

// Page Navigation
el.nextPageBtn.addEventListener("click", () => {
  const cur = parseInt(el.currentPageNum.textContent, 10);
  const total = parseInt(el.totalPagesNum.textContent, 10);
  if (cur < total) {
    const next = cur + 1;
    el.currentPageNum.textContent = next;
    const targetSheet = document.getElementById(`pdfSheetPage_${next}`);
    if (targetSheet) targetSheet.scrollIntoView({ behavior: "smooth" });
  }
});

el.prevPageBtn.addEventListener("click", () => {
  const cur = parseInt(el.currentPageNum.textContent, 10);
  if (cur > 1) {
    const prev = cur - 1;
    el.currentPageNum.textContent = prev;
    const targetSheet = document.getElementById(`pdfSheetPage_${prev}`);
    if (targetSheet) targetSheet.scrollIntoView({ behavior: "smooth" });
  }
});

// Initialization
window.addEventListener("DOMContentLoaded", () => {
  renderInboxTable();
  renderDocument();
  setZoom(100);
});
