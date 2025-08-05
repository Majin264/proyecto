document.addEventListener('DOMContentLoaded', () => {
    const megawattsInput = document.getElementById('megawatts');
    const panelWattageInput = document.getElementById('panel-wattage');
    const calculateBtn = document.getElementById('calculate-btn');
    const panelCountSpan = document.getElementById('panel-count');
    const areaRequiredSpan = document.getElementById('area-required');

    // Función para realizar los cálculos
    function calculateSolar() {
        const megawatts = parseFloat(megawattsInput.value);
        const panelWattage = parseInt(panelWattageInput.value, 10);

        if (isNaN(megawatts) || isNaN(panelWattage) || megawatts <= 0 || panelWattage <= 0) {
            alert("Por favor, introduce valores válidos y positivos.");
            return;
        }

        // 1 Megavatio = 1,000,000 Vatios
        const totalWatts = megawatts * 1000000;

        // Cálculo del número de paneles
        const numberOfPanels = Math.ceil(totalWatts / panelWattage);

        // Estimación del área requerida (aprox. 1.5 hectáreas por MW)
        // Esto puede variar significativamente.
        const areaInHectares = (megawatts * 1.5).toFixed(2);

        panelCountSpan.textContent = numberOfPanels.toLocaleString();
        areaRequiredSpan.textContent = areaInHectares.toLocaleString();
    }

    // Event listener para el botón de calcular
    calculateBtn.addEventListener('click', calculateSolar);

    // Ejecutar el cálculo al cargar la página con los valores por defecto
    calculateSolar();
});