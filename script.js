const form = document.getElementById("item-form");
const itemList = document.getElementById("item-list");
const clearBtn = document.getElementById("clear");
const input = document.getElementById("item-input");
const filter = document.getElementById("filter");
const btn = document.querySelector(".btn");

let isEditMode = false;
function additem(e) {
    e.preventDefault();
    let newItem = input.value;

    if (newItem !== "") {
        // check if exists
        if (checkIfExists(newItem)) {
            alert("Item already axists");
            input.value = "";
            return;
        }
        //create element
        createElement(newItem);

        //addto local storage
        addToLocalStorage(newItem);

        //reset the input field
        input.value = "";
        isEditMode = false;
        checkUI();
    } else {
        alert("enter a value first");
    }
}

function elementClicked(e) {
    e.preventDefault();

    if (e.target.parentElement.classList.contains("remove-item")) {
        removeItem(e.target.parentElement.parentElement);
    } else if (!e.target.classList.contains("items")) {
        updateitems(e.target);
    }
}

function removeItem(item) {
    if (isEditMode === true) {
        item.remove();
    } else if (confirm("Are you sure you want to delete")) {
        item.remove();
        removeFromLocalStorage(item.textContent);
        checkUI();
    }
}

function removeFromLocalStorage(item) {
    let storageItems = getItemsFromLocalStorage();
    storageItems = storageItems.filter((i) => i !== item);

    localStorage.setItem("items", JSON.stringify(storageItems));
}
function checkIfExists(item) {
    let storageItems = getItemsFromLocalStorage();
    return storageItems.includes(item);
}

function createElement(item) {
    const li = document.createElement("li");
    li.textContent = item;

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-xmark";

    const button = document.createElement("button");
    button.className = "remove-item btn-link text-red";
    button.appendChild(icon);
    li.appendChild(button);
    itemList.append(li);
}
function clearItems(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete all items")) {
        while (itemList.firstChild) {
            itemList.firstChild.remove();
        }
        localStorage.clear();
    }
    checkUI();
}

function checkUI() {
    const listitems = document.querySelectorAll("li");

    if (listitems.length === 0) {
        filter.style.display = "none";
        clearBtn.style.display = "none";
    } else {
        filter.style.display = "block";
        clearBtn.style.display = "block";
    }
    btn.innerHTML = `<i class="fa-solid fa-plus"></i> Add Item`;
    btn.style.background = "black";
}

function filterItems(e) {
    let filtervalue = e.target.value.toLowerCase();
    const listitems = document.querySelectorAll("li");

    listitems.forEach((element) => {
        if (!element.textContent.toLowerCase().includes(filtervalue)) {
            element.style.display = "none";
        } else {
            element.style.display = "flex";
        }
    });
}

function addToLocalStorage(item) {
    const storageItems = getItemsFromLocalStorage();
    storageItems.push(item);
    localStorage.setItem("items", JSON.stringify(storageItems));
}
function getItemsFromLocalStorage() {
    let storageItems;
    if (localStorage.getItem("items") === null) {
        storageItems = [];
    } else {
        storageItems = JSON.parse(localStorage.getItem("items"));
    }
    return storageItems;
}

function displayItems() {
    const storageItems = getItemsFromLocalStorage();

    storageItems.forEach((item) => createElement(item));
    checkUI();
}

function updateitems(item) {
    isEditMode = true;
    document.querySelectorAll("li").forEach((e) => e.classList.add("add-mode"));
    item.classList.remove("add-mode");
    item.classList.add("edit-mode");
    btn.style.background = "green";
    btn.innerHTML = `<i class="fa-solid fa-pen"></i>  Update item `;

    input.value = item.textContent;
    removeItem(item);
    removeFromLocalStorage(item.textContent);
}

function initialize() {
    form.addEventListener("submit", additem);
    itemList.addEventListener("click", elementClicked);
    clearBtn.addEventListener("click", clearItems);
    filter.addEventListener("input", filterItems);
    document.addEventListener("DOMContentLoaded", displayItems);

    checkUI();
}
initialize();
