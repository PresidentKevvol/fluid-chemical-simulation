function density_step_gpu(dif, dt) {
    den = diffusion_gpu(0, den, dif, dt);
    
    den = advection_gpu(0, den, velx, vely, dt);
}

function velocity_step_gpu(visc, dt) {
    //velocity diffusion
    velx = diffusion_gpu(1, velx, visc, dt);
    vely = diffusion_gpu(2, vely, visc, dt);
    //remove flux
    [velx, vely] = projection_gpu(velx, vely);
    
    //velocity self advection
    var velx_1 = advection_gpu(1, velx, velx, vely, dt);
    var vely_1 = advection_gpu(2, vely, velx, vely, dt);
    
    //remove flux
    [velx, vely] = projection_gpu(velx_1, vely_1);
    
    velx_1.delete();
    vely_1.delete();
}

//for multiple chemicals
function density_step_multi_gpu(dif, dt) {
    den_a = diffusion_gpu(0, den_a, dif, dt);
    den_b = diffusion_gpu(0, den_b, dif, dt);
    den_c = diffusion_gpu(0, den_c, dif, dt);
    
    den_a = advection_gpu(0, den_a, velx, vely, dt);
    den_b = advection_gpu(0, den_b, velx, vely, dt);
    den_c = advection_gpu(0, den_c, velx, vely, dt);
}

function reaction_step_gpu(dt) {
    var rate = reaction_rate_gpu(den_a, den_b, dt);
    
    den_a = subtraction_gpu(den_a, rate);
    den_c = addition_gpu(den_c, rate);

    rate.delete();
}

var snapshots = [];

//one simulation ticksimulation_step_gpu
//code cited directly from [stam 2003]
//using gpu
function simulation_step_gpu(dt=sec_per_tick) {
    var startTime = performance.now();
    
    //get_input(); //get input from ui (optional for now?)
    velocity_step_gpu(dif_f, dt); //evolve velocity
    density_step_gpu(visc_f, dt); //evolve density
    //gpu_draw_on_canvas(den, 10);   //draw density array on canvas
    

    //snapshots.push([clone(den), clone(velx), clone(vely)]);
    
    var endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms
    console.log("time taken: " + timeDiff);
}

var frame_done = true;

function simulation_step_multi_gpu(dt=sec_per_tick) {
    if(frame_done === false) {
        return;
    }
    
    frame_done = false;
    
    var startTime = performance.now();
    
    //get_input(); //get input from ui (optional for now?)
    velocity_step_gpu(dif_f, dt); //evolve velocity
    density_step_multi_gpu(visc_f, dt); //evolve density
    reaction_step_gpu(dt); //simulate reaction
    
    var endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms
    console.log("time taken: " + timeDiff);
    
    frame_done = true;
}

var frame_ct = 0;
var previousTimeStamp;
var last_bottleneck;
var elapsed;

function simulation_step_gpu_anim_frame(ts) {
    elapsed = ts - previousTimeStamp;
    
    //simulation_step_gpu();
    gpu_draw_on_canvas(den, 10);   //draw density array on canvas now moved to here
    
    if (elapsed > 75) {
        //console.log("frame: " + frame_ct + " (" + (frame_ct - last_bottleneck) + " frames from last bottleneck) time taken: " + elapsed);
        last_bottleneck = frame_ct;
    } else {
        //console.log("time taken: " + elapsed);
    }
    
    previousTimeStamp = ts;
    frame_ct++;
    
    window.requestAnimationFrame(simulation_step_gpu_anim_frame);
}

function simulation_step_multi_gpu_anim_frame(ts) {
    elapsed = ts - previousTimeStamp;
    
    //simulation_step_gpu();
    gpu_draw_on_canvas_multi(den_a, den_b, den_c, 10);   //draw density array on canvas now moved to here
    
    if (elapsed > 75) {
        //console.log("frame: " + frame_ct + " (" + (frame_ct - last_bottleneck) + " frames from last bottleneck) time taken: " + elapsed);
        last_bottleneck = frame_ct;
    } else {
        //console.log("time taken: " + elapsed);
    }
    
    previousTimeStamp = ts;
    frame_ct++;
    
    window.requestAnimationFrame(simulation_step_multi_gpu_anim_frame);
}