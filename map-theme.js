(function () {
    function addDarkTiles(map) {
        return L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
                maxZoom: 20,
                subdomains: "abcd"
            }
        ).addTo(map);
    }

    function createTruckIcon() {
        return L.divIcon({
            className: "suremove-truck-marker",
            html: `
                <span class="suremove-truck-marker__body">
                    <svg viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M5 11h25a2 2 0 0 1 2 2v22H5z" fill="#f20c78"/>
                        <path d="M32 19h8l6 8v8H32z" fill="#ff4d9d"/>
                        <path d="M35 22h4l4 5h-8z" fill="#ffe5f1"/>
                        <path d="M8 15h20v2H8z" fill="#ff9ac7" opacity=".8"/>
                        <circle cx="14" cy="36" r="4.5" fill="#09060a" stroke="#ffd1e5" stroke-width="2"/>
                        <circle cx="38" cy="36" r="4.5" fill="#09060a" stroke="#ffd1e5" stroke-width="2"/>
                    </svg>
                </span>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            popupAnchor: [0, -22]
        });
    }

    window.SureMoveMapTheme = {
        addDarkTiles,
        createTruckIcon,
        routeStyle: {
            color: "#25e6c4",
            weight: 5,
            opacity: 0.95
        },
        stopStyle: {
            radius: 7,
            color: "#06231f",
            weight: 2,
            fillColor: "#25e6c4",
            fillOpacity: 1
        }
    };
})();
