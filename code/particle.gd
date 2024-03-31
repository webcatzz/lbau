extends StaticBody2D


signal velocity_changed
signal drag_ended

@export var data: Particle

var radius: float
var color: Color = Color.WHITE

var velocity: Vector2 = Vector2.ZERO:
	set(value):
		velocity = value
		emit_signal("velocity_changed")
var mousepos: Vector2
var being_dragged: bool = false
var being_hovered: bool = false

#var arrow: Texture2D = load("res://assets/arrow.png")


func _ready():
	radius = float(data.n + 15) / 2
	set_name.call_deferred(data.get_symbol() + " #1")
	color = Color(randf(), randf(), randf())
	data.owner = self.get_path()
	renamed.connect(func(): data.owner = self.get_path())
	
	$Collision.shape.radius = radius
	$ReactionArea/Shape.shape.radius = radius * 3
	$Label.add_theme_font_size_override("font_size", radius)
	$Label.text = data.get_symbol()
	
	$ReactionArea.body_entered.connect(func(body: Node2D): data.on_particle_nearby(body.data))


func _physics_process(_delta):
	var lerp_toward = data.generate_velocity()
	if velocity != Vector2.ZERO or lerp_toward != Vector2.ZERO:
		var coll_info = move_and_collide(velocity * global.time_scale)
		if coll_info is KinematicCollision2D:
			velocity = Vector2.ZERO
		
		velocity = velocity.lerp(lerp_toward, 0.05 * global.time_scale)
	if being_dragged:
		mousepos = position - get_viewport().get_mouse_position()
		queue_redraw()
		if Input.is_action_just_released("click"):
			emit_signal("drag_ended")


func _draw():
	draw_circle(Vector2.ZERO, radius, color)
	if being_hovered:
		draw_arc(Vector2.ZERO, radius, 0, TAU, 32, Color.WHITE, 1)
	if being_dragged:
		draw_dashed_line(Vector2.ZERO, mousepos, Color("#fee761bf"), 1, 4)
		
#		draw_set_transform(Vector2.ZERO, mousepos.angle())
#		draw_texture(arrow, (mousepos.rotated(-mousepos.angle())) - Vector2(2, 3.5))


func on_hover(value: bool):
	being_hovered = value
	if being_hovered:
		global.hovered = get_path()
	else:
		global.hovered = ""
	queue_redraw()


func on_area_input(_viewport, event: InputEvent, _shape_idx):
	if event.is_action_pressed("click"):
		being_dragged = true
		await drag_ended
		being_dragged = false
		velocity = mousepos * 0.05
		print("%s:\treleased with velocity %s." % [name, velocity])
