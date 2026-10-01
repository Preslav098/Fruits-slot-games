import rules from "../../../shared/game-config.json";
import { SymbolImage } from "../interfaces/SymbolType";

export class RulesPanel {
    private button: HTMLButtonElement;
    private dialog: HTMLDialogElement;

    constructor() {
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.className = "rules-button";
        this.button.textContent = "ⓘ Правила";
        this.button.setAttribute("aria-haspopup", "dialog");

        this.dialog = document.createElement("dialog");
        this.dialog.className = "rules-dialog";
        this.dialog.setAttribute("aria-labelledby", "rules-title");

        const header = document.createElement("div");
        header.className = "rules-header";

        const title = document.createElement("h2");
        title.id = "rules-title";
        title.textContent = "Правила и печалби";

        const close = document.createElement("button");
        close.type = "button";
        close.className = "rules-close";
        close.textContent = "✕";
        close.setAttribute("aria-label", "Затвори правилата");

        header.append(title, close);

        const description = document.createElement("p");
        description.textContent =
            `Играта има ${rules.paylines.length} активни линии. ` +
            "BET е общият залог за едно завъртане. " +
            "Печалбите се определят от последователни еднакви " +
            "символи от най-лявата колона. За всяка линия се " +
            "изплаща само най-дългото съвпадение.";

        const payoutInfo = document.createElement("p");
        payoutInfo.textContent =
            "Стойностите в таблицата са множители на общия залог. " +
            "Печалбите от различните линии се събират.";

        const example = document.createElement("p");
        example.textContent =
            `Пример: при BET 10 и три ябълки на една линия ` +
            `печалбата е 10 × ${rules.paytable.apple["3"]} = ` +
            `${10 * rules.paytable.apple["3"]} кредита.`;

        const tableWrapper = document.createElement("div");
        tableWrapper.className = "rules-table-wrapper";

        const table = document.createElement("table");
        table.className = "rules-table";

        const thead = document.createElement("thead");
        const headingRow = document.createElement("tr");

        for (const heading of [
            "Символ",
            "3 еднакви",
            "4 еднакви",
            "5 еднакви",
        ]) {
            const cell = document.createElement("th");
            cell.scope = "col";
            cell.textContent = heading;
            headingRow.appendChild(cell);
        }

        thead.appendChild(headingRow);

        const tbody = document.createElement("tbody");

        for (const [symbol, payouts] of Object.entries(
            rules.paytable,
        )) {
            const row = document.createElement("tr");
            const symbolCell = document.createElement("th");
            symbolCell.scope = "row";

            const image = document.createElement("img");
            image.src =
                SymbolImage[symbol as keyof typeof SymbolImage];
            image.alt = symbol;
            image.width = 42;
            image.height = 42;

            symbolCell.appendChild(image);
            row.appendChild(symbolCell);

            for (const count of ["3", "4", "5"] as const) {
                const cell = document.createElement("td");
                cell.textContent = `${payouts[count]}×`;
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        }

        table.append(thead, tbody);
        tableWrapper.appendChild(table);

        const linesTitle = document.createElement("h3");
        linesTitle.textContent = "Печеливши линии";

        const lines = document.createElement("ol");

        for (const payline of rules.paylines) {
            const item = document.createElement("li");

            item.textContent = payline
                .map((row) => ["горе", "среда", "долу"][row])
                .join(" → ");

            lines.appendChild(item);
        }

        const note = document.createElement("p");
        note.className = "rules-note";
        note.textContent =
            "Демо с виртуални кредити. STOP ускорява анимацията " +
            "и не променя вече определения резултат.";

        this.dialog.append(
            header,
            description,
            payoutInfo,
            example,
            tableWrapper,
            linesTitle,
            lines,
            note,
        );

        this.button.addEventListener("click", () => {
            if (!this.dialog.open) {
                this.dialog.showModal();
            }
        });

        close.addEventListener("click", () => {
            this.dialog.close();
        });

        this.dialog.addEventListener("close", () => {
            this.button.blur();
        });

        // Space в диалога не трябва да стартира играта.
        this.dialog.addEventListener("keydown", (event) => {
            event.stopPropagation();
        });

        this.button.addEventListener("keydown", (event) => {
            event.stopPropagation();
        });

        document.body.append(this.button, this.dialog);
    }

    setEnabled(enabled: boolean) {
        this.button.disabled = !enabled;
    }

    destroy() {
        this.dialog.remove();
        this.button.remove();
    }
}