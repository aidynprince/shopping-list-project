const form = document.getElementById("item-form");

function additem(e) {
    e.preventDefault();
    const input = document.getElementById("item-input");
    const itemlist = document.getElementById("item-list");

    if (input.value !== "") {
        const li = document.createElement("li");
        li.textContent = input.value;

        const icon = document.createElement("i");
        icon.className = "fa-solid fa-xmark";

        const button = document.createElement("button");
        button.className = "remove-item btn-link text-red";
        button.appendChild(icon);
        li.appendChild(button);
        itemlist.append(li);
        input.value = "";
    } else {
        alert("enter a value first");
    }
}

form.addEventListener("submit", additem);
