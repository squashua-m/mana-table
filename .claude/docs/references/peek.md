# Peek Feature Specification

## Overview
**Peek** is a mechanical state that allows a player to interact with the top cards of their library using a temporary, private workspace. This workspace functions identically to the user's primary hand in terms of visibility and interaction logic, serving as a staging area for deck manipulation.

---

## Trigger and Entry
* **Activation:** The user initiates a Peek by tapping an **eye icon** button located within the card actions menu on hover.
* **Initial State:** Upon tapping the eye icon, the user’s primary hand hides off-screen.
* **The Temp Hand:** A new temporary "hand" appears to hold the cards being peeked.

---

## Interaction Logic
* **Drawing to Peek:**
    * Each tap of the eye icon moves the next card from the top of the library into this temporary hand.
    * A badge containing the eye icon and a **counter** is displayed on the deck.
    * The counter increments by 1 for every card added to the temporary hand.
* **Moving from Peek:**
    * Users can drag cards from the temporary hand to four valid locations:
        1.  **Top of Library:** Returns the card to the top of the deck.
        2.  **Bottom of Library:** Returns the card to the bottom of the deck.
        3.  **Player Hand:** Moves the card into the user's permanent hand.
        4.  **Graveyard:** Moves the card into the graveyard.
* **First In, First Out (FIFO) Bottom Logic:**
    * When multiple cards are sent to the bottom of the library, the order is determined by the sequence of the drag actions.
    * If a card is sent to the bottom, and then a second card is sent to the bottom, that second card becomes the new absolute bottom of the deck.

---

## Exit and Resolution
* **Counter Behavior:** As cards are dragged out of the temporary hand and into the deck, hand, or graveyard, the counter on the deck badge decrements.
* **Termination:** Once the counter reaches **0**, the Peek state concludes:
    * The temporary hand interface hides.
    * The badge on the deck hides.
    * The user’s primary hand returns to the screen.