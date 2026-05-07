import FormData from "form-data";
try {
    const form = new FormData();
    form.append("test", "value");
    console.log("FormData works, headers:", form.getHeaders());
} catch (e) {
    console.error("FormData failed:", e);
}
