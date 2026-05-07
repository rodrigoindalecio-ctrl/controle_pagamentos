import { jsPDF } from "jspdf";
try {
    const doc = new jsPDF();
    doc.text("Hello world!", 10, 10);
    const output = doc.output("arraybuffer");
    console.log("PDF generated successfully, size:", output.byteLength);
} catch (e) {
    console.error("PDF generation failed:", e);
}
