const data = {
	levels: [
		[true, true, false, false, false, false],
		[false, false, false, false, false, false],
		[false, false, false, false, false, false]
	],
	isUnlocked: (section, level) => {return data.levels[section - 1][level - 1]},
	unlock: (section, level) => {data.levels[section - 1][level - 1] = true},

	loadLevel: (section, level) => location.href = "level.html#" + (level - 1)
};

function hover(el, text, x, y) {
	let box = document.createElement("div");
	box.innerHTML = text;
	box.classList.add("colored", "white", "hover");
	box.style.left = x + "px";
	box.style.top = y + "px";
	document.body.appendChild(box);
	el.addEventListener("mouseout", () => box.remove());
}