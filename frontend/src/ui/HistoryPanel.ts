import type { SpinResult } from "../../../shared/contracts";

export class HistoryPanel {
    private button: HTMLButtonElement;
    private dialog: HTMLDialogElement;
    private content: HTMLDivElement;
    private controller?: AbortController;

    constructor() {
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.className = "rules-button history-button";
        this.button.textContent = "История";
        this.button.setAttribute("aria-haspopup", "dialog");

        this.dialog = document.createElement("dialog");
        this.dialog.className = "rules-dialog";
        this.dialog.setAttribute(
            "aria-labelledby",
            "history-title",
        );

        const header = document.createElement("div");
        header.className = "rules-header";

        const title = document.createElement("h2");
        title.id = "history-title";
        title.textContent = "Последни завъртания";

        const close = document.createElement("button");
        close.type = "button";
        close.className = "rules-close";
        close.textContent = "✕";
        close.setAttribute("aria-label", "Затвори историята");

        header.append(title, close);

        this.content = document.createElement("div");

        this.dialog.append(header, this.content);
        document.body.append(this.button, this.dialog);

        this.button.addEventListener("click", () => {
            if (this.dialog.open) return;

            this.dialog.showModal();
            void this.load();
        });

        close.addEventListener("click", () => {
            this.dialog.close();
        });

        this.dialog.addEventListener("close", () => {
            this.controller?.abort();
            this.button.blur();
        });

        this.dialog.addEventListener("keydown", (event) => {
            event.stopPropagation();
        });

        this.button.addEventListener("keydown", (event) => {
            event.stopPropagation();
        });
    }

    private async load() {
        this.controller?.abort();

        const controller = new AbortController();
        this.controller = controller;

        this.content.textContent = "Зареждане…";

        try {
            const response = await fetch("/api/history", {
                signal: controller.signal,
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Неуспешно зареждане на историята");
            }

            const data = await response.json() as {
                history: SpinResult[];
            };

            if (controller.signal.aborted) return;

            this.render(data.history);
        } catch (error) {
            if (controller.signal.aborted) return;

            this.content.textContent =
                error instanceof Error
                    ? error.message
                    : "Неуспешно зареждане";
        }
    }

    private render(history: SpinResult[]) {
        this.content.replaceChildren();

        if (!history.length) {
            this.content.textContent = "Още няма завъртания.";
            return;
        }

        const note = document.createElement("p");
        note.textContent =
            "Последните 50 завъртания, най-новите първи. " +
            "Балансът е този след съответното завъртане.";

        const wrapper = document.createElement("div");
        wrapper.className = "rules-table-wrapper";

        const table = document.createElement("table");
        table.className = "rules-table";

        const thead = document.createElement("thead");
        const heading = document.createElement("tr");

        for (const label of [
            "Spin ID",
            "Залог",
            "Печалба",
            "Баланс",
        ]) {
            const cell = document.createElement("th");
            cell.scope = "col";
            cell.textContent = label;
            heading.appendChild(cell);
        }

        thead.appendChild(heading);

        const tbody = document.createElement("tbody");

        for (const spin of history) {
            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            const id = document.createElement("details");
            const summary = document.createElement("summary");
            const fullId = document.createElement("code");

            summary.textContent = spin.spinId.slice(0, 8);
            fullId.textContent = spin.spinId;
            fullId.className = "history-spin-id";

            id.append(summary, fullId);
            idCell.appendChild(id);
            row.appendChild(idCell);

            for (const value of [
                spin.bet,
                spin.totalWin,
                spin.credits,
            ]) {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        }

        table.append(thead, tbody);
        wrapper.appendChild(table);

        this.content.append(note, wrapper);
    }

    setEnabled(enabled: boolean) {
        this.button.disabled = !enabled;
    }

    destroy() {
        this.controller?.abort();
        this.dialog.remove();
        this.button.remove();
    }
}