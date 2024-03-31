extends PanelContainer


func _ready():
#	global.play(load("res://assets/music/level_select.mp3"), global.sfx)
	
	var files: PackedStringArray = DirAccess.get_files_at("res://data/levels")
	files.remove_at(files.find("level.gd"))
	for i in files:
		i = i.get_basename()
		$VBox/Scroll/List.add_item(i)
	$VBox/Scroll/List.max_columns = ceil(float(files.size()) / 4)


func on_item_selected():
	pass
