function density_step_gpu(dif, dt) {
    den = diffusion_gpu(0, den, dif, dt);
    
    //den = advection_gpu(0, den, velx, vely, dt);
    var d1 = create_field_grid();
    advection(0, d1, den.toArray(), velx.toArray(), vely.toArray(), dt);
    den = d1;
}

function velocity_step_gpu(visc, dt) {
    //velocity diffusion
    velx = diffusion_gpu(1, velx, visc, dt);
    vely = diffusion_gpu(2, vely, visc, dt);
    //remove flux
    [velx, vely] = projection_gpu(velx, vely);
    
    //velocity self advection
//    var velx_1 = advection_gpu(1, velx, velx, vely, dt);
//    var vely_1 = advection_gpu(2, vely, velx, vely, dt);
    var velx_1 = create_field_grid();
    var vely_1 = create_field_grid();
    advection(1, velx_1, velx.toArray(), velx.toArray(), vely.toArray(), dt);
    advection(2, vely_1, vely.toArray(), velx.toArray(), vely.toArray(), dt);
    //remove flux
    [velx, vely] = projection_gpu(velx_1, vely_1);
    
    //velx_1.delete();
    //vely_1.delete();
}

var snapshots = [];

//one simulation ticksimulation_step_gpu
//code cited directly from [stam 2003]
//using gpu
function simulation_step_gpu() {
    var startTime = performance.now();
    
    //get_input(); //get input from ui (optional for now?)
    velocity_step_gpu(dif_f, sec_per_tick); //evolve velocity
    density_step_gpu(visc_f, sec_per_tick); //evolve density
    gpu_draw_on_canvas(den, 10);   //draw density array on canvas
    
    //snapshots.push([clone(den), clone(velx), clone(vely)]);
    
    var endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms
    //console.log("time taken: " + timeDiff);
}


