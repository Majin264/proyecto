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
    (async () => {
  // 1) Enregistrer les contrôleurs/échelles géo
  Chart.register(
    ChartGeo.ChoroplethController,
    ChartGeo.GeoFeature,
    ChartGeo.ProjectionScale,
    ChartGeo.ColorScale,
    ChartGeo.SizeScale
  );

  // 2) Données d’irradiance (exemples réalistes; remplace par tes valeurs si besoin)
  const irradiancia = [
    { departamento: "Antioquia", v: 5.6 }, { departamento: "Atlántico", v: 5.8 },
    { departamento: "Bogotá D.C.", v: 4.8 }, { departamento: "Valle del Cauca", v: 5.4 },
    { departamento: "Cundinamarca", v: 5.0 }, { departamento: "Santander", v: 5.7 },
    { departamento: "Norte de Santander", v: 5.7 }, { departamento: "La Guajira", v: 6.5 },
    { departamento: "Cesar", v: 6.0 }, { departamento: "Magdalena", v: 6.1 },
    { departamento: "Bolívar", v: 5.9 }, { departamento: "Sucre", v: 5.8 },
    { departamento: "Córdoba", v: 5.7 }, { departamento: "Chocó", v: 4.9 },
    { departamento: "Cauca", v: 5.2 }, { departamento: "Nariño", v: 4.9 },
    { departamento: "Huila", v: 5.6 }, { departamento: "Tolima", v: 5.5 },
    { departamento: "Caldas", v: 5.2 }, { departamento: "Quindío", v: 5.3 },
    { departamento: "Risaralda", v: 5.3 }, { departamento: "Meta", v: 5.6 },
    { departamento: "Casanare", v: 5.9 }, { departamento: "Arauca", v: 5.8 },
    { departamento: "Boyacá", v: 5.1 }, { departamento: "Guaviare", v: 5.5 },
    { departamento: "Guainía", v: 5.4 }, { departamento: "Vaupés", v: 5.2 },
    { departamento: "Vichada", v: 5.7 }, { departamento: "Amazonas", v: 5.0 },
    { departamento: "Putumayo", v: 5.1 }, { departamento: "Caquetá", v: 5.2 },
    { departamento: "San Andrés y Providencia", v: 5.7 }
  ];

  const RAW_GIST_URL = "https://gist.githubusercontent.com/john-guerra/43c7656821069d00dcbc/raw/colombia.geo.json";

  // Normalise les noms pour matcher les clés
  const norm = s => String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[.,]/g,'')
    .replace(/\s+/g,' ').trim().toUpperCase();

  const valuesByDept = new Map(irradiancia.map(d => [norm(d.departamento), Number(d.v)]));

  // --- Fonction de rendu ---
  function drawMap(geo) {
    // Déterminer la propriété "nom" dans ce GeoJSON (gist utilise NOMBRE_DPT)
    const props = geo.features?.[0]?.properties || {};
    const nameProp = (["NOMBRE_DPT","name","NAME","NAME_1","DPTO_CNMBR","DPTO"]
                      .find(k => k in props)) || Object.keys(props)[0];

    const dataForMap = geo.features.map(f => {
      const name = f.properties?.[nameProp] ?? "";
      const val = valuesByDept.get(norm(name));
      return { feature: f, value: (val ?? null), __name: name };
    });

    const nums = dataForMap.map(d => d.value).filter(v => typeof v === 'number' && !Number.isNaN(v));
    const vmin = nums.length ? Math.min(...nums) : 4.5;
    const vmax = nums.length ? Math.max(...nums) : 6.5;

    const ctx = document.getElementById("mapIrradiance").getContext("2d");
    new Chart(ctx, {
      type: "choropleth",
      data: {
        labels: dataForMap.map(d => d.__name),
        datasets: [{
          label: "Irradiancia (kWh/m²/año)",
          outline: { type: "FeatureCollection", features: geo.features },
          data: dataForMap
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display:false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const n = ctx.raw?.__name ?? "";
                const v = ctx.raw?.value;
                return (typeof v === 'number')
                  ? `${n}: ${v.toFixed(2)} kWh/m²/año`
                  : `${n}: datos no disponibles`;
              }
            }
          }
        },
        scales: {
          // IMPORTANT : définir axis pour éviter l’erreur "reading 'axis'"
          projection: { axis: 'x', projection: "mercator" },
          color: {
            axis: 'y',
            interpolate: "Oranges",
            min: vmin,
            max: vmax,
            unknownColor: "rgba(0,0,0,0.06)"
          }
        }
      }
    });
  }

  // --- Tentative de fetch depuis le gist ---
  let geoFromGist = null;
  try {
    const r = await fetch(RAW_GIST_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    geoFromGist = await r.json();
  } catch (e) {
    console.warn("⚠️ Fetch gist bloqué:", e.message);
  }

  if (geoFromGist && geoFromGist.type === "FeatureCollection") {
    drawMap(geoFromGist);
  } else {
    // Affiche un message doux et laisse l’utilisateur coller le JSON
    console.log("Passage en mode manuel: colle le GeoJSON et clique “Charger le GeoJSON collé”.");
  }

  // --- Fallback manuel ---
  document.getElementById("btnLoadManual").addEventListener("click", () => {
    const txt = document.getElementById("geojsonManual").value.trim();
    if (!txt) { alert("Colle le contenu JSON puis réessaie."); return; }
    try {
      const parsed = JSON.parse(txt);
      if (!parsed || parsed.type !== "FeatureCollection") throw new Error("Format inattendu");
      drawMap(parsed);
    } catch (e) {
      console.error("GeoJSON collé invalide:", e);
      alert("Le GeoJSON collé est invalide. Vérifie et réessaie.");
    }
  });
})();
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
