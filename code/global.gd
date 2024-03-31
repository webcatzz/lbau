extends Node


var particle: PackedScene = load("res://code/particle.tscn")
@export var time_scale: float = 1.0
var hovered: NodePath

@onready var music = $Music
@onready var sfx = $SFX
@onready var animator = $UI/Animator
@onready var dictionary = $UI/Dictionary


func load_level(level_name: String):
	# fetching level:
	var level: Resource = load("res://data/levels/" + level_name + ".tres")
	
	# generating scene, loading in particles:
#	var scene_root: ColorRect = ColorRect.new()
	var scene_root: Node2D = Node2D.new()
	scene_root.name = "Root"
#	scene_root.color = level.background
	for i in level.particles:
		var new_particle: Node = particle.instantiate()
		new_particle.position = i.position
		new_particle.data = i
#		new_particle.color = level.particle_palette[randi_range(0, level.particle_palette.size() - 1)]
		scene_root.add_child(new_particle)
		new_particle.owner = scene_root
	
	# switching to new scene
	var new_scene: PackedScene = PackedScene.new()
	new_scene.pack(scene_root)
	get_tree().change_scene_to_packed(new_scene)
#	await get_tree().process_frame
#	get_node("/root/Root").anchors_preset = Control.PRESET_FULL_RECT
#	get_node("/root/Root").mouse_filter = Control.MOUSE_FILTER_IGNORE


func play(audio: AudioStreamMP3, audio_player: AudioStreamPlayer):
	audio_player.stream = audio
	audio_player.play()
	print("Now playing: ", audio.resource_path)


func _unhandled_key_input(event: InputEvent):
	if event.is_action_pressed("shift"):
		print("Slowing time to 0.1...")
		$UI/TimeGradient.visible = true
		animator.play("slow_time")
	elif event.is_action_released("shift"):
		print("Speeding up time to 1.0..")
		animator.play_backwards("slow_time")
		await animator.animation_finished
		$UI/TimeGradient.visible = false
	elif event.is_action_released("open_dictionary"):
		if !dictionary.visible:
			dictionary.visible = true
			animator.play("open_dictionary")
			if !hovered.is_empty(): dictionary.display_entry(get_node(hovered).data)
		else:
			animator.play_backwards("open_dictionary")
			await animator.animation_finished
			dictionary.visible = false
