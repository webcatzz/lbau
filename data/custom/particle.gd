extends Resource
class_name Particle

## Base type for particles.


@export_group("Level")
## The particle's position on the screen. Used for loading levels.
@export var position: Vector2
## The path of the node the resource is attached to.
var owner: NodePath


## Used to generate a velocity to lerp towards for atomic bonds.
func generate_velocity() -> Vector2:
	return Vector2.ZERO


## Shorthand function for grabbing the node the resource is attached to.
func get_owner() -> StaticBody2D:
	return global.get_node(owner)
