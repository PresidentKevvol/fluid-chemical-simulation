var main_vas;
var main_ctx;

//the field grid for x,y velocity and density
var velx = create_field_grid();
var vely = create_field_grid();

velx = to_gpu_texture(velx);
vely = to_gpu_texture(vely);

//the js interval object for the simulation loop
var simulation_loop_interval;

function ijs_setup() {
    main_vas = gpu_draw_canvas;
    document.getElementById('canvas-space').appendChild(main_vas);

    //simulation_loop_interval = setInterval(simulation_step_multi, 25);
    
    simulation_step_bz();
    gpu_draw_on_canvas_bz(den_X, den_Y, den_Z, -6, 0);
    
    //document.getElementById("start-sim").addEventListener("click", start_simulation);
    document.getElementById("start-sim").addEventListener("click", start_btn_clicked);
}

function start_btn_clicked(event) {
    if (!playing) {
        start_simulation();
        event.target.innerHTML = "pause simulation";
    } else {
        pause_simulation();
        event.target.innerHTML = "resume simulation";
    }
}

function start_simulation() {
    simulation_step_bz();
    
    simulation_loop_interval = setInterval(simulation_step_bz, 75);
    
    playing = true;
    window.requestAnimationFrame(simulation_step_bz_anim_frame);
}

function pause_simulation() {
    clearInterval(simulation_loop_interval);
    
    playing = false;
}

document.addEventListener("DOMContentLoaded", ijs_setup);