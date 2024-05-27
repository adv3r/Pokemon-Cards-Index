document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search");
    const groupFilter = document.getElementById("group-filter");
    const rarityFilter = document.getElementById("rarity-filter");
    const sortOptions = document.getElementById("sort-options");
    const limitInput = document.getElementById("limit");
    const resultsInfo = document.getElementById("results-info");
    const results = document.getElementById("results");
    const collectionButtons = document.getElementById("collection-buttons");
    const generateCollectionButton = document.getElementById("generate-collection");
    const clearCollectionButton = document.getElementById("clear-collection");
    let allCards = [];
    let filteredCards = [];
    let selectedCards = [];
    let debounceTimeout;

    fetch('data/cards.json')
        .then(response => response.json())
        .then(data => {
            allCards = data.flatMap(group => group.data);
            populateFilters(allCards);
            renderCards();
        });

    const debounce = (func, delay) => {
        return function (...args) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const debouncedRenderCards = debounce(renderCards, 300);

    searchInput.addEventListener("input", debouncedRenderCards);
    groupFilter.addEventListener("change", renderCards);
    rarityFilter.addEventListener("change", renderCards);
    sortOptions.addEventListener("change", renderCards);
    limitInput.addEventListener("input", renderCards);

    generateCollectionButton.addEventListener("click", generateCollection);
    clearCollectionButton.addEventListener("click", clearCollection);

    function populateFilters(cards) {
        const groups = [...new Set(cards.map(card => card.catalog_group))];
        const rarities = [...new Set(cards.map(card => card.rarity))];

        groups.forEach(group => {
            const option = document.createElement("option");
            option.value = group;
            option.textContent = group;
            groupFilter.appendChild(option);
        });

        rarities.forEach(rarity => {
            const option = document.createElement("option");
            option.value = rarity;
            option.textContent = rarity;
            rarityFilter.appendChild(option);
        });
    }

    function renderCards() {
        const searchQuery = searchInput.value.toLowerCase();
        const selectedGroup = groupFilter.value;
        const selectedRarity = rarityFilter.value;
        const sortOption = sortOptions.value;
        const limit = parseInt(limitInput.value, 10) || 10;

        filteredCards = allCards
            .filter(card => {
                return (
                    (card.product_name.toLowerCase().includes(searchQuery) ||
                        card.card_number.includes(searchQuery) ||
                        card.catalog_group.toLowerCase().includes(searchQuery)) &&
                    (!selectedGroup || card.catalog_group === selectedGroup) &&
                    (!selectedRarity || card.rarity === selectedRarity)
                );
            })
            .sort((a, b) => {
                if (sortOption === "number-asc") {
                    return a.card_number.localeCompare(b.card_number);
                } else if (sortOption === "number-desc") {
                    return b.card_number.localeCompare(a.card_number);
                } else if (sortOption === "name-asc") {
                    return a.product_name.localeCompare(b.product_name);
                } else if (sortOption === "name-desc") {
                    return b.product_name.localeCompare(a.product_name);
                } else if (sortOption === "random") {
                    return 0.5 - Math.random();
                }
            });

        resultsInfo.textContent = `Showing ${Math.min(limit, filteredCards.length)} of ${filteredCards.length} cards`;

        results.innerHTML = filteredCards.slice(0, limit).map(card => `
            <div class="card" data-card-number="${card.card_number}">
                <img src="${card.image_url}" alt="${card.product_name}">
                <div class="card-details">
                    <p><strong>${card.product_name}</strong></p>
                    <p>Set: ${card.catalog_group}</p>
                    <p>Number: ${card.card_number}</p>
                    <p>Rarity: ${card.rarity}</p>
                </div>
                <button class="toggle-collection">Add to Collection</button>
            </div>
        `).join('');

        // Apply animation
        const cardElements = results.querySelectorAll('.card');
        cardElements.forEach((card, index) => {
            card.style.animationDelay = `${index * 100}ms`;
            const button = card.querySelector('.toggle-collection');
            button.addEventListener('click', () => toggleCollection(card, button));
        });
    }

    function toggleCollection(card, button) {
        const cardNumber = card.getAttribute('data-card-number');
        const cardIndex = selectedCards.findIndex(c => c.card_number === cardNumber);

        if (cardIndex === -1) {
            selectedCards.push(filteredCards.find(c => c.card_number === cardNumber));
            button.classList.add('is-toggled');
            button.textContent = 'Remove from Collection';
        } else {
            selectedCards.splice(cardIndex, 1);
            button.classList.remove('is-toggled');
            button.textContent = 'Add to Collection';
        }

        if (selectedCards.length > 0) {
            collectionButtons.style.display = 'flex';
            generateCollectionButton.textContent = `Generate Collection (${selectedCards.length})`;
        } else {
            collectionButtons.style.display = 'none';
        }
    }

    function generateCollection() {
        const jsonText = JSON.stringify(selectedCards, null, 2);
        const textArea = document.createElement('textarea');
        textArea.value = jsonText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Collection JSON copied to clipboard');
    }

    function clearCollection() {
        selectedCards = [];
        const buttons = document.querySelectorAll('.toggle-collection');
        buttons.forEach(button => {
            button.textContent = 'Add to Collection';
            button.classList.remove('is-toggled');
        });
        collectionButtons.style.display = 'none';
    }
});
