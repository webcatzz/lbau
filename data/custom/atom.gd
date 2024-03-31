extends Particle
class_name Atom


enum Names {ERR, H, He, Li, Be, B, C, N, O, F, Ne, Na, Mg, Al, Si, P, S, Cl, Ar, K, Ca, Sc, Ti, V, Cr, Mn, Fe, Co, Ni, Cu, Zn, Ga, Ge, As, Se, Br, Kr, Rb, Sr, Y, Zr, Nb, Mo, Tc, Ru, Rh, Pg, Ag, Cd, In, Sn, Sb, Te, I, Xe}

## The atom's atomic number, or proton count.
@export var n: Names:
	set(value):
		n = value
		add_electrons(n, false)

## The atom's electron cloud. Each element of the array represents the number of electrons in its respective electron shell.
var cloud: PackedInt32Array = [0, 0, 0, 0, 0, 0, 0]
## The atom's charge. Updates alongside [code]cloud[/code].
var charge: int = 0

## An array of each of the atom's bonds, represented by [code]Bond[/code]s.
@export var bonds: Array[Bond]


## Returns the element's atomic symbol (e.g. O for oxygen or Ne for neon).
func get_symbol() -> String:
	return Names.keys()[n]


## Returns the name of the element's group.
func get_group() -> String:
	if n in [1, 6, 7, 8, 9, 15, 16, 17, 34, 35, 53]:
		return "Reactive nonmetal"
	elif n in [3, 11, 19, 37, 55, 87]:
		return "Alkali metal"
	elif n in [4, 12, 20, 38, 56, 88]:
		return "Alkaline earth Mmtal"
	elif n >= 21 and n <= 30 or n >= 39 and n <= 48:
		return "Transition metal"
	elif n in [13, 31, 49, 50, 81, 82, 83, 84, 85]:
		return "Post-transition metal"
	elif n in [5, 14, 32, 33, 51, 52]:
		return "Metalloid"
	elif n in [2, 10, 18, 36, 54, 86, 118]:
		return "Noble gas"
	return ""


## Returns the element's full name.
func get_fullname() -> String:
	return ["ERR", "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminum", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon"][n]


## Distributes [code]count[/code] electrons into the atom's electron shells according to the aufbau principle, the Pauli exclusion principle, and Hund's rule. If [code]count[/code] is negative, electrons will be removed instead.
func add_electrons(count: int, update_charge: bool = true):
	if count > 0:
		for i in count:
			if cloud[1] < 2: cloud[1] += 1 # filling 1s
			elif cloud[2] < 8: cloud[2] += 1 # filling 2s and 2p
			elif cloud[3] < 8: cloud[3] += 1 # filling 3s and 3p
			elif cloud[4] < 2: cloud[4] += 1 # filling 4s
			elif cloud[3] < 18: cloud[3] += 1 # filling 3d
			elif cloud[4] < 8: cloud[4] += 1 # filling 4p
			elif cloud[5] < 2: cloud[5] += 1 # filling 5s
			elif cloud[4] < 18:cloud[4] += 1 # filling 4d
			elif cloud[5] < 8: cloud[5] += 1 # filling 5p
			elif cloud[6] < 2: cloud[6] += 1 # filling 6s
			elif cloud[4] < 25: cloud[4] += 1 # filling 4f
			elif cloud[5] < 18: cloud[5] += 1 # filling 5d
			elif cloud[6] < 8: cloud[6] += 1 # filling 6p
			else: print("No more room in electron cloud!")
			if update_charge: charge -= 1
	else:
		for i in -count:
			if cloud[6] > 2: cloud[6] -= 1 # removing from 6p
			elif cloud[5] > 8: cloud[5] -= 1 # removing from 5d
			elif cloud[4] > 11: cloud[4] -= 1 # removing from 4f
			elif cloud[6] > 0: cloud[6] -= 1 # removing from 6s
			elif cloud[5] > 2: cloud[5] -= 1 # removing from 5p
			elif cloud[4] > 8: cloud[4] -= 1 # removing from 4d
			elif cloud[5] > 0: cloud[5] -= 1 # removing from 5s
			elif cloud[4] > 2: cloud[4] -= 1 # removing from 4p
			elif cloud[3] > 8: cloud[3] -= 1 # removing from 3d
			elif cloud[4] > 0: cloud[4] -= 1 # removing from 4s
			elif cloud[3] > 0: cloud[3] -= 1 # removing from 3s and 3p
			elif cloud[2] > 0: cloud[2] -= 1 # removing from 2s and 2p
			elif cloud[1] > 0: cloud[1] -= 1 # removing from 1s
			if update_charge: charge += 1


## Returns the number of electrons needed to complete an atom's valence shell. Can be either positive or negative. Used for ionic reactions.
func get_electron_need() -> int:
	if cloud[4] == 0:
		# grabbing # of electrons in valence shell:
		var valence_shell: int
		if cloud[2] == 0: valence_shell = cloud[1]
		elif cloud[3] == 0: valence_shell = cloud[2]
		else: valence_shell = cloud[3]
		
		# returning need
		if valence_shell < 4: # wants to lose electrons
			return -valence_shell
		elif valence_shell == 8 or n == Names.H: # noble gas
			return 0
		else: # wants to gain electrons
			return 8 - valence_shell
	else:
		return 0 # insert code for rows 4+


## Runs whenever another particle passes through the atom's reaction area.
func on_particle_nearby(particle: Particle):
	var need_1: int = get_electron_need()
	var need_2: int = particle.get_electron_need()
	if need_1 == -need_2 and need_2 != 0: # ionic reaction
		for i in bonds:
			if i.p1 == particle or i.p2 == particle:
				return
		
		var new_bond: Bond = Bond.new()
		new_bond.form_from(self, particle, Bond.Type.IONIC)
		#print("%s:\tReacting with %s!" % [get_owner().name, particle.get_owner().name])


func generate_velocity() -> Vector2:
	var velocity: Vector2 = Vector2.ZERO
	for i in bonds:
		velocity += i.generate_velocity(self)
	if bonds.size() != 0:
		return velocity / bonds.size()
	
	return velocity
