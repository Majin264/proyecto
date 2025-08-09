document.addEventListener('DOMContentLoaded', async () => {

    console.log("✅ scripts.js cargado correctamente");

    Chart.defaults.font.family = "'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif";
    Chart.defaults.color = '#555'; 

    // CALCULADORA DE PANELES SOLARES
    const megawattsInput = document.getElementById('megawatts');
    const panelWattageInput = document.getElementById('panel-wattage');
    const calculateBtn = document.getElementById('calculate-btn');
    const panelCountSpan = document.getElementById('panel-count');
    const areaRequiredSpan = document.getElementById('area-required');

    function calculateSolar() {
        const megawatts = parseFloat(megawattsInput.value);
        const panelWattage = parseInt(panelWattageInput.value, 10);

        if (isNaN(megawatts) || isNaN(panelWattage) || megawatts <= 0 || panelWattage <= 0) {
            alert("Por favor, introduce valores válidos y positivos.");
            return;
        }

        const totalWatts = megawatts * 1_000_000;
        const numberOfPanels = Math.ceil(totalWatts / panelWattage);
        const areaInHectares = (megawatts * 1.5).toFixed(2);

        panelCountSpan.textContent = numberOfPanels.toLocaleString();
        areaRequiredSpan.textContent = areaInHectares.toLocaleString();
    }

    calculateBtn.addEventListener('click', calculateSolar);
    calculateSolar();

    // === 1. Gráfico de Irradiancia por Departamento ===
    try {
        const irradianciaData = await fetch('data/irradiacion.json').then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            return res.json();
        });
        console.log("📂 Irradiancia:", irradianciaData);

        const departamentos = irradianciaData.irradiancia_por_departamento.map(d => d.departamento);
        const valoresIrradiancia = irradianciaData.irradiancia_por_departamento.map(d => d.irradiancia_kwh_m2_ano);

        new Chart(document.getElementById('graficoIrradiancia'), {
            type: 'bar',
            data: {
                labels: departamentos,
                datasets: [{
                    label: 'Irradiancia (kWh/m²/año)',
                    data: valoresIrradiancia,
                    backgroundColor: 'orange'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { autoSkip: false, maxRotation: 90, minRotation: 45 } } }
            }
        });
    } catch (err) {
        console.error("❌ Error cargando irradiacion.json:", err);
    }

    // === 2. Producción Acumulada considerando pérdida de eficiencia ===
    try {
        const eficienciaData = await fetch('data/eficienciapanel.json').then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            return res.json();
        });
        console.log("📂 Eficiencia:", eficienciaData);

        const anos = eficienciaData.eficiencia_energetica_panel.map(e => e.ano);
        const eficiencia = eficienciaData.eficiencia_energetica_panel.map(e => e.eficiencia_estimada);

        let produccionAnual = eficiencia.map(e => (e / eficiencia[0]) * 100);
        let produccionAcumulada = produccionAnual.map((val, idx) =>
            produccionAnual.slice(0, idx + 1).reduce((a, b) => a + b, 0)
        );

        new Chart(document.getElementById('graficoProduccion'), {
            type: 'line',
            data: {
                labels: anos,
                datasets: [{
                    label: 'Producción acumulada (relativa)',
                    data: produccionAcumulada,
                    fill: true,
                    backgroundColor: 'rgba(0, 123, 255, 0.3)',
                    borderColor: 'blue',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { 
                    x: { title: { display: true, text: 'Años' } },
                    y: { title: { display: true, text: 'Producción (%)' } }
                }
            }
        });
    } catch (err) {
        console.error("❌ Error cargando eficienciapanel.json:", err);
    }

    // === 3. Matriz Energética ===
    try {
        const matrizData = await fetch('data/matrizenergetica.json').then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            return res.json();
        });
        console.log("📂 Matriz energética:", matrizData);

        const fuentes = matrizData.matriz_energetica_desglosada.map(f => f.fuente);
        const porcentajes = matrizData.matriz_energetica_desglosada.map(f => f.porcentaje_total);

        new Chart(document.getElementById('graficoMatriz'), {
            type: 'doughnut',
            data: {
                labels: fuentes,
                datasets: [{
                    label: 'Participación %',
                    data: porcentajes,
                    backgroundColor: [
                        '#007bff', '#28a745', '#ffc107', '#dc3545',
                        '#17a2b8', '#6f42c1', '#fd7e14'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'right' } }
            }
        });
    } catch (err) {
        console.error("❌ Error cargando matrizenergetica.json:", err);
    }

});
