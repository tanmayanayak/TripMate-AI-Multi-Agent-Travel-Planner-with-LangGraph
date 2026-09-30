let currentThreadId = localStorage.getItem("travel_thread_id") || null;
let latestAnswerMarkdown = "";

function setPrompt(text) {
    document.getElementById("userInput").value = text;
}

function setLoading(isLoading) {
    const sendBtn = document.getElementById("sendBtn");
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");

    sendBtn.disabled = isLoading;

    if (isLoading) {
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");
    } else {
        btnText.classList.remove("hidden");
        btnLoader.classList.add("hidden");
    }
}

function showError(message) {
    const errorBox = document.getElementById("errorBox");

    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    const errorBox = document.getElementById("errorBox");

    errorBox.classList.add("hidden");
    errorBox.textContent = "";
}

function showResult(answer, threadId) {
    latestAnswerMarkdown = answer;

    const resultSection = document.getElementById("resultSection");
    const resultBox = document.getElementById("resultBox");
    const threadInfo = document.getElementById("threadInfo");

    if (typeof marked !== "undefined") {
        resultBox.innerHTML = marked.parse(answer);
    } else {
        resultBox.innerText = answer;
    }

    threadInfo.textContent = `Thread ID: ${threadId}`;

    resultSection.classList.remove("hidden");

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function sendMessage() {
    hideError();

    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) {
        showError("Please enter your travel request first.");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch("/api/travel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                thread_id: currentThreadId
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Something went wrong.");
        }

        currentThreadId = data.thread_id;
        localStorage.setItem("travel_thread_id", currentThreadId);

        showResult(data.answer, data.thread_id);

    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

function copyResult() {
    const resultBox = document.getElementById("resultBox");
    const text = resultBox.innerText;

    if (!text) {
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            const copyBtn = document.querySelector(".copy-btn");
            const oldText = copyBtn.textContent;

            copyBtn.textContent = "Copied!";

            setTimeout(() => {
                copyBtn.textContent = oldText;
            }, 1400);
        })
        .catch(() => {
            showError("Could not copy result.");
        });
}




function downloadPDF() {
    const pdfContent = document.getElementById("pdfContent");

    if (!latestAnswerMarkdown || !pdfContent) {
        showError("No travel plan available to download.");
        return;
    }

    const downloadBtn = document.querySelector(".download-btn");
    const oldText = downloadBtn.textContent;

    downloadBtn.textContent = "Preparing PDF...";
    downloadBtn.disabled = true;

    // Make sure the content is fully expanded before PDF generation
    const originalStyle = {
        height: pdfContent.style.height,
        maxHeight: pdfContent.style.maxHeight,
        overflow: pdfContent.style.overflow
    };

    pdfContent.style.height = "auto";
    pdfContent.style.maxHeight = "none";
    pdfContent.style.overflow = "visible";

    const options = {
        margin: [0.5, 0.5, 0.5, 0.5],

        filename: "ai-travel-plan.pdf",

        image: {
            type: "jpeg",
            quality: 0.98
        },

        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",

            // Important for long pages
            scrollX: 0,
            scrollY: 0,

            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight
        },

        jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
        },

        /*
         * IMPORTANT:
         * Do NOT use "avoid-all".
         * It causes large blank areas when the content
         * contains long sections/tables.
         */
        pagebreak: {
            mode: ["css", "legacy"]
        }
    };

    html2pdf()
        .set(options)
        .from(pdfContent)
        .toPdf()
        .get("pdf")
        .then((pdf) => {
            console.log(
                "PDF pages generated:",
                pdf.internal.getNumberOfPages()
            );
        })
        .save()
        .then(() => {

            // Restore original styles
            pdfContent.style.height = originalStyle.height;
            pdfContent.style.maxHeight = originalStyle.maxHeight;
            pdfContent.style.overflow = originalStyle.overflow;

            downloadBtn.textContent = oldText;
            downloadBtn.disabled = false;
        })
        .catch((error) => {

            console.error("PDF generation error:", error);

            // Restore original styles
            pdfContent.style.height = originalStyle.height;
            pdfContent.style.maxHeight = originalStyle.maxHeight;
            pdfContent.style.overflow = originalStyle.overflow;

            downloadBtn.textContent = oldText;
            downloadBtn.disabled = false;

            showError("Could not download PDF.");
        });
}


document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "Enter") {
        sendMessage();
    }
});