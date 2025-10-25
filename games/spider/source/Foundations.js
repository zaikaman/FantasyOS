import Card         from "./Card.js";
import Data         from "./Data.js";
import { getCardImageUrl } from "./ImageLoader.js";



/**
 * Spider Foundations
 */
export default class Foundations {

    /**
     * Spider Foundations constructor
     */
    constructor() {
        this.amount   = 0;
        this.element  = document.querySelector(".foundations");

        /** @type {HTMLElement[]} */
        this.children = [];

        /** @type {Card[][]} */
        this.columns  = [];

        this.build();
    }

    /**
     * Returns the current index
     * @returns {Number}
     */
    get index() {
        return Data.foundations - this.amount - 1;
    }

    /**
     * Returns the Bounds of the children
     * @returns {Object}
     */
    get bounds() {
        return this.columnBounds(this.index)
    }

    /**
     * Returns the Bounds of the children at the given index
     * @param {Number} index
     * @returns {Object}
     */
    columnBounds(index) {
        return this.children[index].getBoundingClientRect();
    }

    /**
     * Builds the Foundations
     * @returns {Void}
     */
    build() {
        this.element.innerHTML = "";
        for (let i = 0; i < Data.foundations; i++) {
            const div = document.createElement("div");
            div.className = "slot";
            this.element.appendChild(div);
            this.children.push(div);
            this.columns[i] = [];
        }
    }

    /**
     * Resets the Foundations
     * @returns {Void}
     */
    reset() {
        for (let i = 0; i < Data.foundations; i++) {
            this.children[i].innerHTML = "";
            this.columns[i] = [];
        }
        this.amount = 0;
    }

    /**
     * Restores the Foundations
     * @param {Card[][]} cards
     * @returns {Void}
     */
    restore(cards) {
        this.amount = 0;
        for (let i = 0; i < Data.foundations; i++) {
            if (cards[i].length) {
                this.push(cards[i]);
            } else {
                this.children[i].innerHTML = "";
                this.columns[i] = [];
            }
        }
    }

    /**
     * Pushes a Sequence to the Foundation
     * @param {Card[]} cards
     * @returns {Void}
     */
    push(cards) {
        const suit = cards[0].suit;
        const img = document.createElement("img");
        img.src = getCardImageUrl(`A${suit[0]}`);
        img.alt = suit;
        this.children[this.index].innerHTML = "";
        this.children[this.index].appendChild(img);
        this.columns[this.index] = cards;
        this.amount += 1;
    }

    /**
     * Pops the last Sequence from the Foundation
     * @returns {Card[]}
     */
    pop() {
        this.amount -= 1;
        this.children[this.index].innerHTML = "";
        const cards = this.columns[this.index];
        this.columns[this.index] = [];
        return cards.reverse();
    }
}
