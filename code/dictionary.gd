extends ColorRect


@onready var title_node = $Entry/VBox/Title
@onready var tags_node = $Entry/VBox/Tags
@onready var body_node = $Entry/VBox/Body


func display_entry(data: Resource):
	for i in tags_node.get_children():
		i.queue_free()
	
	var title: String
	var tags: PackedStringArray
	var body: String
	
	if data is Atom:
		title = data.get_fullname()
		var group: String = data.get_group()
		tags.append("Atom")
		tags.append(group)
		
		body = "%s (%s) is the %s%s element of the periodic table. It is %s." % [title, data.get_symbol(), data.n, get_number_ending(data.n), add_article(group.to_lower())]
	
	title_node.text = title
	for i in tags:
		var label = Label.new()
		label.text = i
		label.theme_type_variation = &"TagLabel"
		tags_node.add_child(label)
	body_node.text = body


func add_article(string: String) -> String:
	var article: String = "a "
	if string.substr(0, 1).to_lower() in ["a", "e", "i", "o", "u"]:
		article = "an "
	return string.insert(0, article)


func get_number_ending(i: int) -> String:
	if str(i).ends_with("1") and i != 11:
		return "st"
	elif str(i).ends_with("2") and i != 12:
		return "nd"
	elif str(i).ends_with("3") and i != 13:
		return "rd"
	return "th"
