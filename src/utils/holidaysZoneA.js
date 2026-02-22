/**
 * Dates des vacances scolaires de la Zone A (France).
 * Comprend: Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon, Poitiers.
 *
 * Les dates de fin correspondent au jour de reprise des cours. Le jour de reprise n'est pas un jour de vacance.
 */
export const zoneAHolidays = [
    // 2023 - 2024
    { name: "Vacances de Noël", start: '2023-12-23', end: '2024-01-08' },
    { name: "Vacances d'Hiver", start: '2024-02-17', end: '2024-03-04' },
    { name: "Vacances de Printemps", start: '2024-04-13', end: '2024-04-29' },
    { name: "Pont de l'Ascension", start: '2024-05-08', end: '2024-05-13' },
    { name: "Vacances d'Été", start: '2024-07-06', end: '2024-09-02' },
    { name: "Vacances de la Toussaint", start: '2024-10-19', end: '2024-11-04' },
    { name: "Vacances de Noël", start: '2024-12-21', end: '2025-01-06' },

    // 2024 - 2025
    { name: "Vacances d'Hiver", start: '2025-02-22', end: '2025-03-10' },
    { name: "Vacances de Printemps", start: '2025-04-19', end: '2025-05-05' },
    { name: "Pont de l'Ascension", start: '2025-05-28', end: '2025-06-02' },
    { name: "Vacances d'Été", start: '2025-07-05', end: '2025-09-01' },
    { name: "Vacances de la Toussaint", start: '2025-10-18', end: '2025-11-03' },
    { name: "Vacances de Noël", start: '2025-12-20', end: '2026-01-05' },

    // 2025 - 2026
    { name: "Vacances d'Hiver", start: '2026-02-07', end: '2026-02-23' },
    { name: "Vacances de Printemps", start: '2026-04-11', end: '2026-04-27' },
    { name: "Pont de l'Ascension", start: '2026-05-13', end: '2026-05-18' },
    { name: "Vacances d'Été", start: '2026-07-04', end: '2026-09-01' }, // Approx return date
];

/**
 * Génère toutes les dates individuelles listées dans les périodes de vacances.
 * @returns {Array<string>} Tableau de chaînes de caractères au format YYYY-MM-DD
 */
export const getZoneADates = () => {
    const dates = [];

    zoneAHolidays.forEach(period => {
        let currentDate = new Date(period.start);
        const endDate = new Date(period.end);

        while (currentDate < endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    return dates;
};
