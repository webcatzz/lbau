extends Resource
class_name Bond


enum Type {ERR, IONIC}

var p1: Particle
var p2: Particle
var type: Type


func form_from(particle_1: Particle, particle_2: Particle, passed_type: Type):
	p1 = particle_1
	p2 = particle_2
	p1.bonds.append(self)
	p2.bonds.append(self)
	type = passed_type
	
	if type == Type.IONIC:
		var p1_need: int = p1.get_electron_need()
		var p2_need: int = p2.get_electron_need()
		p1.add_electrons(-p2_need)
		p2.add_electrons(-p1_need)


func generate_velocity(particle: Particle) -> Vector2:
	var distance = p1.get_owner().position.distance_to(p2.get_owner().position)
	if distance == p1.get_owner().radius + p2.get_owner().radius:
		return Vector2.ZERO
	elif distance > 128:
		break_bond()
		return Vector2.ZERO
	
	return (p1.get_owner().position - p2.get_owner().position) * (0.05 if particle == p2 else -0.05)


func break_bond():
	p1.bonds.erase(self)
	p2.bonds.erase(self)
	
	if type == Type.IONIC:
		p1.add_electrons(p1.charge)
		p2.add_electrons(p2.charge)
	
	print("Bond (%s, %s) broken!" % [p1.get_owner().name, p2.get_owner().name])
