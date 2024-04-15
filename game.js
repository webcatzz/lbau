oncontextmenu = () => {return false};

// game
const game = {
	atoms: [], bonds: [], molecules: [],
	add: (el, arr) => arr.push(el),
	remove: (el, arr) => arr.splice(arr.indexOf(el), 1),

	start: () => {
		game.pause();
		game.interval = setInterval(game.tick, 100/6)
	},
	pause: () => clearInterval(game.interval),
	tick: () => {
		let tick = new Event("tick");
		game.root.dispatchEvent(tick);
		// atoms
		for (let i = 0; i < game.atoms.length; i++) {
			game.atoms[i].dispatchEvent(tick);
			if (game.atoms[i].electronNeed) for (let j = i + 1; j < game.atoms.length; j++) {
				if (game.atoms[j].electronNeed && !game.atoms[i].isBonded(game.atoms[j]) && game.near(game.atoms[i], game.atoms[j], 128)) {
					game.atoms[i].checkReact(game.atoms[j]);
				}
			}
		}
		// bonds
		for (const bond of game.bonds) bond.tick();
		// canvas
		canvas.redraw();
	},

	root: document.getElementById("root"),
	headerY: document.querySelector("header").offsetHeight,
	x: 0, y: 0,
	resize: () => {
		game.width = game.root.parentElement.offsetWidth;
		game.height = game.root.parentElement.offsetHeight;
	},

	inBounds: (x, y) => {
		return x > -game.x && x < -game.x + game.width && y > -game.y && y < -game.y + game.height;
	},
	near: (a, b, distance) => {
		if (Math.abs(a.x - b.x) > distance || Math.abs(a.y - b.y) > distance) return false;
		return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < distance ** 2;
	},
}
game.resize();
game.start();
onblur = game.pause;
onfocus = game.start;


// color palette
const palette = {
	colors: ["red", "yellow", "green", "blue", "purple", "white", "gray", "black"],
	random: function () {return this[this.colors[Math.floor(Math.random() * this.colors.length)]]}
}
for (const color of palette.colors) palette[color] = getComputedStyle(document.body).getPropertyValue("--" + color);


// canvas
const canvas = {
	el: document.querySelector("canvas"),

	redraw: () => {
		canvas.ctx.clearRect(0, 0, canvas.el.width, canvas.el.height);
		for (const bond of game.bonds) bond.draw();
		for (const molecule of game.molecules) molecule.draw();
		if (canvas.trajectory) canvas.draw("line", canvas.trajectory);
	},

	draw: (type, opts) => {
		if (opts.stroke) canvas.ctx.strokeStyle = opts.stroke;
		if (opts.width) canvas.ctx.lineWidth = opts.width;
		if (opts.dashed) canvas.ctx.setLineDash([8,4]);
		if (opts.fill) canvas.ctx.fillStyle = opts.fill;

		if (type === "line") {
			canvas.ctx.beginPath();
			canvas.ctx.moveTo(opts.x1 + game.x, opts.y1 + game.y);
			canvas.ctx.lineTo(opts.x2 + game.x, opts.y2 + game.y);
			canvas.ctx.stroke();
		}
		else if (type === "text") {
			opts.x += game.x;
			opts.y += game.y;
			let metrics = canvas.ctx.measureText(opts.text);
			canvas.ctx.clearRect(opts.x - metrics.width/2, opts.y - 10, metrics.width, 16);
			canvas.ctx.fillText(opts.text, opts.x, opts.y + 2);
		}
		else if (type === "rect") {
			if (opts.fill) canvas.ctx.fillRect(opts.x1 + game.x, opts.y1 + game.y, opts.x2 - opts.x1, opts.y2 - opts.y1);
			if (opts.stroke) canvas.ctx.strokeRect(opts.x1 + game.x, opts.y1 + game.y, opts.x2 - opts.x1, opts.y2 - opts.y1);
		}
		else if (type === "circle") {
			canvas.ctx.arc(opts.x + game.x, opts.y + game.y, opts.radius, 0, Math.PI * 2);
			if (opts.fill) canvas.ctx.fill();
			if (opts.stroke) canvas.ctx.stroke();
		}

		if (opts.dashed) canvas.ctx.setLineDash([]);
	}
};
canvas.ctx = canvas.el.getContext("2d");
canvas.el.width = game.width;
canvas.el.height = game.height;
onresize = () => {
	game.resize();
	canvas.el.width = game.width;
	canvas.el.height = game.height;
}
canvas.ctx.font = "bold 12px sans-serif", canvas.ctx.textAlign = "center";


// tooltips
function hover(el, text, x, y) {
	let box = document.createElement("div");
	box.innerHTML = text;
	box.classList.add("colored", "white", "hover");
	box.style.left = x + "px";
	box.style.top = y + "px";
	document.body.appendChild(box);
	el.addEventListener("mouseout", () => box.remove());
}


// debug
function note(...args) {
	let message = [""];
	for (const arg of args) {
		if (typeof arg == "string") {
			if (Number(arg.trimStart().substring(0,1))) add(arg, palette.green);
			else add(arg);
		}
		else if (typeof arg == "number") add(arg, palette.green);
		else if (typeof arg == "object") {
			if (arg.tagName == "LBAU-ATOM") add((arg.symbol + " ").substring(0, 2), arg.getColor());
		}
	}
	console.log(...message);

	function add(string, color) {
		if (color) {
			message[0] += "%c" + string + "%c";
			message.push("color: " + color, "");
		}
		else message[0] += string;
	}
}


// CUSTOM CLASSES --------------------------------------------------------


// bonds
class Bond {
	a; b; type; electrons;
	angle = 0;

	constructor(p1, p2) {
		// ordering
		if (p1.electronNeed > p2.electronNeed) this.a = p1, this.b = p2;
		else if (p1.electronNeed < p2.electronNeed) this.a = p2, this.b = p1;
		else if (p1.p > p2.p) this.a = p1, this.b = p2;
		else this.a = p2, this.b = p1;
		// type
		let polarization = Math.abs(Atom.data[this.a.p].electronegativity - Atom.data[this.b.p].electronegativity);
		if (polarization > 1.7) this.type = "ionic";
		else if (polarization > 0.4) this.type = "polar-covalent";
		else this.type = "covalent";
		// grabbing electrons
		if (this.type === "ionic") this.electrons = Math.abs(this.a.electronNeed);
		else this.electrons = Math.min(Math.abs(this.a.electronNeed), Math.abs(this.b.electronNeed));
		// updating atoms' bonds and electrons
		this.a.bonds.push(this);
		this.b.bonds.push(this);
		this.a.addElectrons(this.electrons);
		this.b.addElectrons(this.type == "ionic" ? -this.electrons : this.electrons);
		// debug
		note(
			"New ",this.type," (",Atom.data[this.a.p].electronegativity," - ",Atom.data[this.b.p].electronegativity," = ",polarization,") bond formed:",
			"\n\t",this.a," gained ",this.electrons," electron(s), with a new need of ",this.a.electronNeed," and charge of ",this.a.charge,
			"\n\t",this.b,(this.type === "ionic" ? " lost   " : " gained "),this.electrons," electron(s), with a new need of ",this.b.electronNeed," and charge of ",this.b.charge,
		);
		// physics
		if (this.a.bonds.length > this.b.bonds.length) this.a.updateBonds();
		else this.b.updateBonds();
		game.add(this, game.bonds);

		if (this.a.molecule) this.a.molecule.add(this.b);
		else if (this.b.molecule) this.b.molecule.add(this.a);
		else new Molecule(this.a, this.b);
	}

	vector = {x: 0, y: -64};
	rotate(value, inverse) {
		let mult = inverse ? -64 : 64;
		this.vector.x = mult * Math.sin(value);
		this.vector.y = mult * Math.cos(value);
	}
	tick() {
		this.a.applyVelocity(
			(this.b.x - this.a.x - this.vector.x) / 10,
			(this.b.y - this.a.y - this.vector.y) / 10,
		);
		this.b.applyVelocity(
			(this.vector.x + this.a.x - this.b.x) / 10,
			(this.vector.y + this.a.y - this.b.y) / 10,
		);
	}
	draw() {
		if (game.inBounds(this.a.x, this.a.y) || game.inBounds(this.b.x, this.b.y)) {
			canvas.draw("line", {
				stroke: palette.black, width: 4,
				x1: this.a.x, y1: this.a.y,
				x2: this.b.x, y2: this.b.y,
			});
			canvas.draw("text", {
				text: String(this.electrons),
				fill: palette.black,
				x: this.a.x + (this.b.x - this.a.x) / 2,
				y: this.a.y + (this.b.y - this.a.y) / 2,
			});
		}
	}

	break() {
		game.remove(this, game.bonds);
		for (let i = this.electrons; i > 0; i--) canvas.remove(this.key + "-" + i);
		this.a.addElectrons(this.electrons);
		this.b.addElectrons(this.type === "ionic" ? -this.electrons : this.electrons);
		this.a.bonds.splice(this.a.bonds.indexOf(this));
		this.b.bonds.splice(this.b.bonds.indexOf(this));
	}
}


// particles
class Particle extends HTMLElement {
	static dragging;
	color; velocity = {x: 0, y: 0};

	constructor() {
		super();
		this.classList.add("colored", "particle");
		this.setColor(palette.random());
		this.addEventListener("mousedown", this.drag);
		this.addEventListener("tick", this.tick);
	}
	add() {root.appendChild(this)}

	set x(value) {this.style.left = value + "px"}
	set y(value) {this.style.top = value + "px"}
	get x() {return this.offsetLeft}
	get y() {return this.offsetTop}

	setColor(value) {
		this.color = value;
		this.style.setProperty("--color", this.color);
	}

	applyVelocity(x, y) {
		this.velocity.x += x;
		this.velocity.y += y;
	}
	tick() {
		this.velocity.x -= this.velocity.x / 8;
		this.velocity.y -= this.velocity.y / 8;
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}

	drag() {
		let listener = e => this.drawTrajectory(e);
		addEventListener("mousemove", listener);
		addEventListener("mouseup", e => {
			removeEventListener("mousemove", listener);
			delete canvas.trajectory;
			this.applyVelocity((this.x - e.x + game.x) / 3, (this.y - e.y + game.y + game.headerY) / 3);
		}, {once: true});
	}
	drawTrajectory(e) {
		canvas.trajectory = {
			stroke: this.color, width: 2, dashed: true,
			x1: this.x,
			y1: this.y,
			x2: this.x + 2 * (this.x - e.x + game.x),
			y2: this.y + 2 * (this.y - e.y + game.y + game.headerY)
		};
	}

	static get observedAttributes() {return ["x", "y", "color"]}
	attributeChangedCallback(name, oldValue, value) {
		if (name === "color") this.setColor(palette[value]);
		else this[name] = Number(value);
	}
}


// atoms
class Atom extends Particle {
	static symbols = ["?", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pg", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh"];
	static data = {
		1: {
			symbol: "H",
			name: "hydrogen",
			electronegativity: 2.2
		},
		2: {
			symbol: "He",
			name: "helium"
		},
		3: {
			symbol: "Li",
			name: "lithium",
			electronegativity: 0.98
		},
		4: {
			symbol: "Be",
			name: "beryllium",
			electronegativity: 1.57
		},
		5: {
			symbol: "B",
			name: "boron",
			electronegativity: 2.04
		},
		6: {
			symbol: "C",
			name: "carbon",
			electronegativity: 2.55
		},
		7: {
			symbol: "N",
			name: "nitrogen",
			electronegativity: 3.04
		},
		8: {
			symbol: "O",
			name: "oxygen",
			electronegativity: 3.44
		},
		9: {
			symbol: "F",
			name: "fluorine",
			electronegativity: 3.98
		},
		10: {
			symbol: "Ne",
			name: "neon"
		},
		11: {
			symbol: "Na",
			name: "sodium",
			electronegativity: 0.93
		},
		12: {
			symbol: "Mg",
			name: "magnesium",
			electronegativity: 1.31
		},
		13: {
			symbol: "Al",
			name: "alumnium",
			electronegativity: 1.61
		},
		14: {
			symbol: "Si",
			name: "silicon",
			electronegativity: 1.90
		},
		15: {
			symbol: "P",
			name: "phosphorus",
			electronegativity: 2.19
		},
		16: {
			symbol: "S",
			name: "sulfur",
			electronegativity: 2.58
		},
		17: {
			symbol: "Cl",
			name: "chlorine",
			electronegativity: 3.16
		},
		18: {
			symbol: "Ar",
			name: "argon"
		},
		19: {
			symbol: "K",
			name: "potassium",
			electronegativity: 0.82
		},
		20: {
			symbol: "Ca",
			name: "calcium",
			electronegativity: 1
		},
		21: {
			symbol: "Sc",
			name: "scandium",
			electronegativity: 1.36
		},
		22: {
			symbol: "Ti",
			name: "titanium",
			electronegativity: 1.54
		},
		23: {
			symbol: "V",
			name: "vanadium",
			electronegativity: 1.63
		},
		24: {
			symbol: "Cr",
			name: "chromium",
			electronegativity: 1.66
		},
		25: {
			symbol: "Mn",
			name: "manganese",
			electronegativity: 1.55
		},
		26: {
			symbol: "Fe",
			name: "iron",
			electronegativity: 1.83
		},
		27: {
			symbol: "Co",
			name: "cobalt",
			electronegativity: 1.88
		},
		28: {
			symbol: "Ni",
			name: "nickel",
			electronegativity: 1.91
		},
		29: {
			symbol: "Cu",
			name: "copper",
			electronegativity: 1.90
		},
		30: {
			symbol: "Zn",
			name: "zinc",
			electronegativity: 1.65
		},
		31: {
			symbol: "Ga",
			name: "gallium",
			electronegativity: 1.81
		},
		32: {
			symbol: "Ge",
			name: "germanium",
			electronegativity: 2.01
		},
		33: {
			symbol: "As",
			name: "arsenic",
			electronegativity: 2.18
		},
		34: {
			symbol: "Se",
			name: "sellenium",
			electronegativity: 2.55
		},
		35: {
			symbol: "Br",
			name: "bromine",
			electronegativity: 2.96
		},
		36: {
			symbol: "Kr",
			name: "krypton",
			electronegativity: 3
		},
		37: {
			symbol: "Rb",
			name: "rubidium",
			electronegativity: 0.82
		},
		38: {
			symbol: "Sr",
			name: "strontium",
			electronegativity: 0.95
		},
		39: {
			symbol: "Y",
			name: "yttrium",
			electronegativity: 1.22
		},
		40: {
			symbol: "Zr",
			name: "zirconium",
			electronegativity: 1.33
		},
		41: {
			symbol: "Nb",
			name: "niobium",
			electronegativity: 1.6
		},
		42: {
			symbol: "Mo",
			name: "molybdenum",
			electronegativity: 2.16
		},
		43: {
			symbol: "Tc",
			name: "technetium",
			electronegativity: 1.9
		},
		44: {
			symbol: "Ru",
			name: "ruthenium",
			electronegativity: 2.2
		},
		45: {
			symbol: "Rh",
			name: "rhodium",
			electronegativity: 2.82
		},
		46: {
			symbol: "Pd",
			name: "palladium",
			electronegativity: 2.2
		},
		47: {
			symbol: "Ag",
			name: "silver",
			electronegativity: 1.93
		},
		48: {
			symbol: "Cd",
			name: "cadmium",
			electronegativity: 1.69
		},
		49: {
			symbol: "In",
			name: "indium",
			electronegativity: 1.78
		},
		50: {
			symbol: "Sn",
			name: "tin"
		},
		51: {
			symbol: "Sb",
			name: "antimony"
		},
		52: {
			symbol: "Te",
			name: "tellurium"
		},
		53: {
			symbol: "I",
			name: "iodine"
		},
		54: {
			symbol: "Xe",
			name: "xenon"
		},
		55: {
			symbol: "Cs",
			name: "caesium"
		},
		56: {
			symbol: "Ba",
			name: "barium"
		},
		57: {
			symbol: "La",
			name: "lanthanum",
		},
		72: {
			symbol: "Hf",
			name: "hafnium"
		},
		73: {
			symbol: "Ta",
			name: "tantalum"
		},
		74: {
			symbol: "W",
			name: "tungsten"
		},
		75: {
			symbol: "Re",
			name: "rhenium"
		},
		76: {
			symbol: "Os",
			name: "osmium"
		},
		77: {
			symbol: "Ir",
			name: "iridium"
		},
		78: {
			symbol: "Pt",
			name: "platinum"
		},
		79: {
			symbol: "Au",
			name: "gold"
		},
		80: {
			symbol: "Hg",
			name: "mercury"
		},
		81: {
			symbol: "Tl",
			name: "thallium"
		},
		82: {
			symbol: "Pb",
			name: "lead"
		},
		83: {
			symbol: "Bi",
			name: "bismuth"
		},
		84: {
			symbol: "Po",
			name: "polonium"
		},
		85: {
			symbol: "At",
			name: "astatine"
		},
		86: {
			symbol: "Rn",
			name: "radon"
		},
		87: {
			symbol: "Fr",
			name: "francium"
		},
		88: {
			symbol: "Ra",
			name: "radium"
		},
		89: {
			symbol: "Ac",
			name: "actinium"
		},
		104: {
			symbol: "Rf",
			name: "Rutherfordium"
		},
		105: {
			symbol: "Db",
			name: "Dubnium"
		},
		106: {
			symbol: "Sg",
			name: "Seaborgium"
		},
		107: {
			symbol: "Bh",
			name: "Bohrium"
		},
	}

	p; n;
	cloud = {
		charge: 0,
		1: 0, // {total: 0, s: 0},
		2: 0, // {total: 0, s: 0, p: 0},
		3: 0, // {total: 0, s: 0, p: 0, d: 0},
		4: 0, // {total: 0, s: 0, p: 0, d: 0, f: 0},
		5: 0, // {total: 0, s: 0, p: 0, d: 0},
		6: 0, // {total: 0, s: 0, p: 0},
	};
	bonds = [];
	label;

	constructor() {
		super();
		this.classList.add("atom");
	}
	connectedCallback() {
		// visuals
		this.setColor(this.getColor());
		this.style.width = 25 + this.getPeriod() * 5 + "px";
		this.label = this.appendChild(document.createElement("span"));
		this.updateSymbol();
		// updating cloud
		this.addElectrons(this.p);
		this.cloud.charge = 0;
		// physics
		game.add(this, game.atoms);
		// tooltip
		this.onmouseover = () => hover(this, this.getName(), this.x + game.x, this.y + game.y + (this.clientWidth / 2) + 60);
		// ptable
		this.onauxclick = e => {
			let info = document.getElementById("info");
			info.classList.remove("hidden");
			info.querySelector("lbau-table").dispatchEvent(new CustomEvent("select", {detail: {atom: this.symbol}}));
		};
		// debug
		note("New atom ",this," with need ",this.electronNeed);
	}

	get symbol() {return Atom.symbols[this.p]}
	set symbol(value) {this.p = Atom.symbols.indexOf(value)}
	getName() {
		let name = Atom.data[this.p].name;

		if (
			this.p != 1 && this.p != 34 &&
			this.bonds.length < 2 &&
			this.cloud.charge < 0 &&
			this.getType() === "Reactive non-metal"
		) {
			let suffix;
			if (name.endsWith("ine")) suffix = name.length - 3;
			else if (this.p === 8) suffix = 2;
			else if (this.p === 16) suffix = 4;
			else suffix = name.lastIndexOf("o");
			name = name.substring(0, suffix) + "ide";
		}

		if (this.cloud.charge) name += "<sup>" + this.charge + "</sup>"

		return name;
	}
	get charge() {return this.cloud.charge > 0 ? this.cloud.charge + "+" : -this.cloud.charge + "-"}

	// bonds & reactions
	electronNeed;
	checkReact(atom) {
		if (
			Math.abs(this.electronNeed) === Math.abs(atom.electronNeed) ||
			(this.electronNeed > 0 && atom.electronNeed > 0)
		) new Bond(this, atom);
		else note(this," (",this.electronNeed,") and ",atom," (",atom.electronNeed,") did not react");
	}
	isBonded(atom) {
		for (const bond of this.bonds) if (bond.a == atom || bond.b == atom) return true;
		return false;
	}
	updateBonds() {
		let start = 0;
		for (let i = 0; i < this.bonds.length; i++) {
			let rot = (start + i / this.bonds.length) * Math.PI * 2
			if (this.bonds[i].b == this) this.bonds[i].rotate(rot);
			else this.bonds[i].rotate(rot, true);
			note(this," sorted bond between ",this.bonds[i].a," and ",this.bonds[i].b, " to ",360 * i / this.bonds.length,"°");
		}
	}

	// electron cloud
	addElectrons(num = 1) {
		if (num > 0) while (num-- > 0) this.cloud[this.getValenceShell()]++;
		else while (num++ < 0) this.cloud[this.getValenceShell()]--;
		this.cloud.charge += num;
		// updating electron need // todo: transition metal psuedo-nobles
		let valence = this.getValenceShell();
		let valenceNum = this.cloud[valence];
		let valenceMax = this.getValenceMax();
		if (valenceNum == 8 || valence == 1 && valenceNum == 2) this.electronNeed = 0;
		else if (valenceNum < valenceMax/2 && valence != 1) this.electronNeed = -valenceNum;
		else this.electronNeed = valenceMax - valenceNum;
	}
	getValenceShell() {
		if (this.cloud[1] < 2) return 1; // 1s
		else if (this.cloud[2] < 8) return 2; // 2s, 2p
		else if (this.cloud[3] < 8) return 3; // 3s, 3p
		else if (this.cloud[4] < 2) return 4; // 4s
		else if (this.cloud[3] < 18) return 3; // 3d
		else if (this.cloud[4] < 8) return 4; // 4p
		else if (this.cloud[5] < 2) return 5; // 5s
		else if (this.cloud[4] < 18) return 4; // 4d
		else if (this.cloud[5] < 8) return 5; // 5p
		else if (this.cloud[6] < 2) return 6; // 6s
		else if (this.cloud[4] < 25) return 4; // 4f
		else if (this.cloud[5] < 18) return 5; // 5d
		else if (this.cloud[6] < 8) return 6; // 6p
	}
	getValenceMax() {
		if (this.cloud[1] < 2) return 2; // 1s
		else if (this.cloud[2] < 8) return 8; // 2s, 2p
		else if (this.cloud[3] < 8) return 8; // 3s, 3p
		else if (this.cloud[4] < 2) return 2; // 4s
		else if (this.cloud[3] < 18) return 18; // 3d
		else if (this.cloud[4] < 8) return 8; // 4p
		else if (this.cloud[5] < 2) return 2; // 5s
		else if (this.cloud[4] < 18) return 18; // 4d
		else if (this.cloud[5] < 8) return 8; // 5p
		else if (this.cloud[6] < 2) return 2; // 6s
		else if (this.cloud[4] < 25) return 25; // 4f
		else if (this.cloud[5] < 18) return 18; // 5d
		else if (this.cloud[6] < 8) return 8; // 6p
	}

	// groups & periods
	getGroup() {
		let idx = this.p;
		if (this.p >= 2) idx += 16;
		if (this.p >= 5) idx += 10;
		if (this.p >= 13) idx += 10;
		if (this.p >= 72) idx -= 14;
		if (this.p >= 104) idx -= 14;
		idx %= 18;
		return idx ? idx : 18;
	}
	getPeriod() {
		if (this.p > 86) return 7;
		if (this.p > 54) return 6;
		if (this.p > 36) return 5;
		if (this.p > 18) return 4;
		if (this.p > 10) return 3;
		if (this.p > 2) return 2;
		return 1;
	}
	getType() {
		let group = this.getGroup();
		// hyrodgen and alkali metals
		if (group == 1) return this.p == 1 ? "Reactive non-metal" : "Alkali metal";
		// alkaline earth metals
		if (group == 2) return "Alkaline earth metal";
		// transition metals
		if (group == 3) return this.p == 57 ? "Lathanide" : this.p == 89 ? "Actinide" : "Transition metal";
		if (group >= 4 && group <= 12) return "Transition metal";
		// post-transition metals to reactive non-metals
		if (group == 13) return this.p == 5 ? "Metalloid" : "Post-transition metal";
		if (group == 14) return this.p == 6 ? "Reactive non-metal" : this.p <= 32 ? "Metalloid" : "Post-transition metal";
		if (group == 15) return this.p <= 15 ? "Reactive non-metal" : this.p <= 51 ? "Metalloid" : "Post-transition metal";
		if (group == 16) return this.p <= 34 ? "Reactive non-metal" : this.p == 52 ? "Metalloid" : "Post-transition metal";
		if (group == 17) return this.p <= 53 ? "Reactive non-metal" : "Post-transition metal";
		// noble gases
		if (group == 18) return "Noble gas";
	}

	// visuals
	updateSymbol() {this.label.textContent = this.symbol}
	getColorName() {
		let type = this.getType();
		if (["Alkaline earth metal", "Noble gas"].includes(type)) return "red";
		if (["Metalloid", "Actinide"].includes(type)) return "yellow";
		if (["Alkali metal", "Post-transition metal"].includes(type)) return "green";
		if (["Reactive non-metal", "Lathanide"].includes(type)) return "blue";
		if (["Transition metal"].includes(type)) return "purple";
	}
	getColor() {return palette[this.getColorName()]}

	static get observedAttributes() {return super.observedAttributes.concat(["name", "p"])}
	attributeChangedCallback(name, oldValue, value) {
		if (Particle.observedAttributes.includes(name)) super.attributeChangedCallback(name, oldValue, value);
		else if (name == "name") this.p = Atom.symbols.indexOf(value);
		else if (name == "p") this.p = Number(value);
	}

	disconnectedCallback() {
		game.remove(this, game.atoms);
		for (const bond of this.bonds) bond.break();
	}
}


// molecules
class Molecule {
	atoms = [];

	constructor(...atoms) {
		for (const atom of atoms) this.add(atom);
		game.molecules.push(this);
	}

	add(atom) {
		if (atom.molecule != this) {
			atom.molecule = this;
			this.atoms.push(atom);
		}
	}

	draw() {
		// let minX = this.atoms[0].x, maxX = minX;
		// let minY = this.atoms[0].y, maxY = minY;
		// for (const atom of this.atoms) {
		// 	if (atom.x < minX) minX = atom.x;
		// 	else if (atom.x > maxX) maxX = atom.x;
		// 	if (atom.y < minY) minY = atom.y;
		// 	else if (atom.y > maxY) maxY = atom.y;
		// }
		// canvas.draw("rect", {
		// 	stroke: palette.gray, width: 2, dashed: true,
		// 	x1: minX - 40,
		// 	y1: minY - 40,
		// 	x2: maxX + 40,
		// 	y2: maxY + 40,
		// });
	}


}


// periodic table

class PeriodicTable extends HTMLElement {
	connectedCallback() {
		let atom = new Atom;
		for (let i = 1; i < Atom.symbols.length; i++) {
			if (i == 58) i = 72;
			else if (i == 90) i = 104;
		
			atom.p = i;
			let cell = this.appendChild(document.createElement("button"));
			cell.classList.add("colored", atom.getColorName(), "cell");
			cell.textContent = atom.symbol;
			cell.onclick = this.onselected;
		
			if (i == 2) cell.style.gridColumn = 18;
			else if (i == 5 || i == 13) cell.style.gridColumn = 13;
		}
		this.appendChild(document.createElement("div")).classList.add("colored", "gray", "halftone", "cell", "empty");
	}

	onselected() {
		this.parentElement.dispatchEvent(new CustomEvent("select", {detail: {atom: this.textContent, x: this.parentElement.offsetLeft + this.offsetLeft + this.offsetWidth/2, y: this.parentElement.offsetTop + this.offsetTop + this.offsetHeight/2}}));
	}
}


// defining custom classes
window.customElements.define("lbau-atom", Atom);
window.customElements.define("lbau-table", PeriodicTable);



// pane
let info = document.getElementById("info");
document.getElementById("table-button").onclick = () => {
	if (info.classList.contains("hidden")) {
		info.classList.remove("hidden");
	}
	else {
		info.classList.add("hidden");
	}
}
document.querySelector("#info lbau-table").addEventListener("select", e => {
	let atom = new Atom;
	atom.symbol = e.detail.atom;
	let name = atom.getName();

	let html = `
<h2 class="${atom.getColorName()}">${name[0].toUpperCase() + name.substring(1)}</h2>
<div><b>Symbol:</b> ${atom.symbol}</div>
<div><b>Atomic #:</b> ${atom.p}</div>
<div><b>Group:</b> ${atom.getGroup()}</div>
<div><b>Period:</b> ${atom.getPeriod()}</div>
<div><b>Type:</b> <span style="color: ${atom.getColor()}">${atom.getType()}</span></div>`;
	if (Object.keys(Atom.data).includes(String(atom.p))) {
		let data = Atom.data[atom.p];
		if (data.electronegativity) html += "<div><b>Electronegativity:</b> " + data.electronegativity + "</div>";
		atom.addElectrons(1);
		let ionName = atom.getName().slice(0, -13);
		if (ionName != name) html += "<div><b>Ion:</b> " + ionName + "</div>";
	}

	document.getElementById("pane").innerHTML = html;
})