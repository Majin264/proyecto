<script>
document.addEventListener("DOMContentLoaded", function () {
    // Obtener referencias a los elementos
    const form = document.getElementById("form"); // Asegúrate de que tu formulario tenga id="form"
    const respuestaDiv = document.getElementById("respuesta"); // Asegúrate de tener un div con id="respuesta"

    if (!form || !respuestaDiv) {
        console.error("❌ No se encontró el formulario o el div de respuesta en el DOM.")
        return;
    };

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        respuestaDiv.style.display = "block";
        respuestaDiv.innerText = "⏳ GPT está analizando tu proyecto...";

        // Obtener datos del formulario
        const formData = {
            name: document.getElementById("name")?.value || "",
            company: document.getElementById("company")?.value || "",
            email: document.getElementById("email")?.value || "",
            location: document.getElementById("location")?.value || "",
            namep: document.getElementById("namep")?.value || "",
            ubication: document.getElementById("ubication")?.value || "",
            land: document.getElementById("land")?.value || "",
            ambiente: document.getElementById("ambiente")?.value || "",
            irradiancia: document.getElementById("irradiancia")?.value || "",
            mw: document.getElementById("mw")?.value || "",
            presupuesto: document.getElementById("presupuesto")?.value || ""
        };

        console.log("📤 Datos enviados a GPT:", formData);

        try {
            const res = await fetch("https://40e8057b6360.ngrok-free.app/api/consulta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`);
            }

            const data = await res.json();
            console.log("📥 Respuesta GPT:", data);

            if (data.message) {
                respuestaDiv.innerText = data.message;
            else {
                respuestaDiv.innerText = "❌ Error: " + (data.error || "Respuesta desconocida");
            }
        } catch (err) {
            console.error("❌ Error fetch:", err);
            respuestaDiv.innerText = "❌ Error de red o del servidor";
        }
    )};
});
</script>