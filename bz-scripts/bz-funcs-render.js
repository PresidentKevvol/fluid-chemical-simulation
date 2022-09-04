gpu.addFunction(value_mapping_2);
gpu.addFunction(value_mapping_3);

function draw_on_canvas_bz_krnl(fx, fy, fz, min, max) {
    var i = this.thread.y;
    var j = this.thread.x;
    
    var vx = fx[i][j];
    var vy = fy[i][j];
    var vz = fz[i][j];
    
    /*
    vx = value_mapping_2(vx, min, max);
    vy = value_mapping_2(vy, min, max);
    vz = value_mapping_2(vz, min, max);
    */
    
    vx = (vx > -16) ? value_mapping_3(vx, 0.001) : 1;
    vy = value_mapping_3(vy, 0.12);
    vz = value_mapping_3(vz, 0.004);
    
    this.color(vx, vy, vz, 1);
}

const gpu_draw_on_canvas_bz = gpu.createKernel(draw_on_canvas_bz_krnl, {
  output: [sim_grid_width, sim_grid_height],
}).setGraphical(true);


const gpu_draw_canvas = gpu_draw_on_canvas_bz.canvas;



var frame_done = true;
var calc_time = false;

function simulation_step_bz(dt=sec_per_tick) {
    if(frame_done === false) {
        return;
    }
    
    frame_done = false;
    
    var startTime = performance.now();
    
    //get_input(); //get input from ui (optional for now?)
    velocity_step_gpu(dif_f, dt); //evolve velocity
    density_step_bz(visc_f, dt); //evolve density
    reaction_step_bz(dt); //simulate reaction
    
    if (calc_time) {
        var endTime = performance.now();
        var timeDiff = endTime - startTime; //in ms
        console.log("time taken: " + timeDiff);
    }
    
    frame_done = true;
}

var frame_ct = 0;
var previousTimeStamp;
var last_bottleneck;
var elapsed;

var playing = false;

function simulation_step_bz_anim_frame(ts) {
    elapsed = ts - previousTimeStamp;
    
    //simulation_step_gpu();
    gpu_draw_on_canvas_bz(den_X, den_Y, den_Z, -6, 0);   //draw density array on canvas now moved to here
    
    if (elapsed > 75) {
        //console.log("frame: " + frame_ct + " (" + (frame_ct - last_bottleneck) + " frames from last bottleneck) time taken: " + elapsed);
        last_bottleneck = frame_ct;
    } else {
        //console.log("time taken: " + elapsed);
    }
    
    previousTimeStamp = ts;
    frame_ct++;
    
    if (playing) {
        window.requestAnimationFrame(simulation_step_bz_anim_frame);
    }
}