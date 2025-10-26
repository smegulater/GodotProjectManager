export type GodotIniValue = string | number | boolean | string[] | Record<string, unknown> | undefined;

export type GodotIniSection = Record<string, GodotIniValue>;

export default interface ProjectGodotIni {
	// Root-level items
	config_version?: string | number;

	// ────────────────────────────────────────────────
	// APPLICATION SECTION
	// ────────────────────────────────────────────────
	application?: GodotIniSection & {
		'config/name'?: string;
		'config/features'?: string; // e.g. PackedStringArray("4.5","Mobile")
		'config/icon'?: string;
		'config/description'?: string;
		'config/version'?: string;
		'config/copyright'?: string;
		'config/company_name'?: string;
		'config/product_name'?: string;

		'boot_splash/image'?: string;
		'boot_splash/fullsize'?: boolean | string;
		'boot_splash/show_image'?: boolean | string;
		'boot_splash/minimum_display_time'?: number | string;
		'boot_splash/use_filter'?: boolean | string;
		'boot_splash/bg_color'?: string;

		'run/main_scene'?: string;
		'run/max_fps'?: number | string;
		'run/fixed_fps'?: number | string;
		'run/disable_vsync'?: boolean | string;
		'run/high_dpi_mode'?: string;
		'run/low_processor_usage_mode'?: boolean | string;

		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// DISPLAY SECTION (Godot 3.x style)
	// ────────────────────────────────────────────────
	display?: GodotIniSection & {
		'window/size/width'?: number | string;
		'window/size/height'?: number | string;
		'window/stretch/mode'?: string;
		'window/stretch/aspect'?: string;
		'window/fullscreen'?: boolean | string;
		'window/resizable'?: boolean | string;
		'window/borderless'?: boolean | string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// RENDERING SECTION (Godot 4.x style)
	// ────────────────────────────────────────────────
	rendering?: GodotIniSection & {
		'renderer/rendering_method'?: 'forward_plus' | 'mobile' | 'compatibility';
		'driver/name'?: string;
		'quality/2d/default_texture_filter'?: string;
		'quality/2d/default_texture_repeat'?: string;
		'quality/2d/use_pixel_snap'?: boolean | string;
		'quality/shadows/enable'?: boolean | string;
		'quality/shadows/atlas_size'?: number | string;
		'framebuffer/hdr'?: boolean | string;
		'framebuffer/msaa'?: number | string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// PHYSICS SECTION
	// ────────────────────────────────────────────────
	physics?: GodotIniSection & {
		'common/enable_pause_aware'?: boolean | string;
		'common/fps'?: number | string;
		'2d/physics_engine'?: string;
		'2d/default_gravity'?: number | string;
		'2d/default_gravity_vector'?: string;
		'3d/physics_engine'?: string;
		'3d/default_gravity'?: number | string;
		'3d/default_gravity_vector'?: string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// AUDIO SECTION
	// ────────────────────────────────────────────────
	audio?: GodotIniSection & {
		driver?: string;
		mix_rate?: number | string;
		stream_memory_limit?: number | string;
		max_sources?: number | string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// INPUT SECTION
	// ────────────────────────────────────────────────
	input?: GodotIniSection & {
		// e.g. "move_left"="{'deadzone':0.5,'events':[{'type':'InputEventKey','scancode':16777231}]}"
		[actionName: string]: string | boolean | number | undefined;
	};

	// ────────────────────────────────────────────────
	// GUI / THEME SECTION
	// ────────────────────────────────────────────────
	gui?: GodotIniSection & {
		theme?: string;
		'theme/custom_font'?: string;
		'theme/custom_colors'?: string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// LOCALE / TRANSLATIONS
	// ────────────────────────────────────────────────
	locale?: GodotIniSection & {
		translations?: string[];
		fallback?: string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// NETWORK SECTION
	// ────────────────────────────────────────────────
	network?: GodotIniSection & {
		replication_interval?: number | string;
		server_port?: number | string;
		use_compression?: boolean | string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// EDITOR SECTION
	// ────────────────────────────────────────────────
	editor?: GodotIniSection & {
		author?: string;
		disable_vcs_integration?: boolean | string;
		'import/atlas_max_width'?: number | string;
		'import/reimport_missing_imported_files'?: boolean | string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// AUTOLOAD SECTION
	// ────────────────────────────────────────────────
	autoload?: GodotIniSection & {
		// Example: "Global"="res://scripts/global.gd"
		[singletonName: string]: string | { path: string; singleton: boolean } | undefined;
	};

	// ────────────────────────────────────────────────
	// LAYER NAMES
	// ────────────────────────────────────────────────
	layer_names?: GodotIniSection & {
		'2d_physics/layer_1'?: string;
		'2d_physics/layer_2'?: string;
		'3d_physics/layer_1'?: string;
		'3d_physics/layer_2'?: string;
		'3d_render/layer_1'?: string;
		[key: string]: GodotIniValue;
	};

	// ────────────────────────────────────────────────
	// RESOURCES SECTION
	// ────────────────────────────────────────────────
	resources?: GodotIniSection & {
		[resourcePath: string]: string | number | boolean | undefined;
	};

	// ────────────────────────────────────────────────
	// GLOBAL / CUSTOM SECTIONS
	// ────────────────────────────────────────────────
	global?: GodotIniSection;

	// Fallback for any unlisted section (plugins, etc.)
	[section: string]: GodotIniValue | GodotIniSection | undefined;
}
