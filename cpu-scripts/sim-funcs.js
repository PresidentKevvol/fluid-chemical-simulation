//d will be changed, rest unchanged
function density_step(dif, dt) {
    [den, den_prev] = [den_prev, den];
    diffusion(0, den, den_prev, dif, dt);
    
    [den, den_prev] = [den_prev, den];
    advection(0, den, den_prev, velx, vely, dt);
}

//the simulation tick routine for multiple substances 
function density_step_multi(dif, dt) {
    [den_a, den_a_prev] = [den_a_prev, den_a];
    [den_b, den_b_prev] = [den_b_prev, den_b];
    [den_c, den_c_prev] = [den_c_prev, den_c];
    diffusion(0, den_a, den_a_prev, dif, dt);
    diffusion(0, den_b, den_b_prev, dif, dt);
    diffusion(0, den_c, den_c_prev, dif, dt);
    
    [den_a, den_a_prev] = [den_a_prev, den_a];
    [den_b, den_b_prev] = [den_b_prev, den_b];
    [den_c, den_c_prev] = [den_c_prev, den_c];
    advection(0, den_a, den_a_prev, velx, vely, dt);
    advection(0, den_b, den_b_prev, velx, vely, dt);
    advection(0, den_c, den_c_prev, velx, vely, dt);
}

function velocity_step(visc, dt) {
    //swap so the current field calculated last tick becomes previous
    //and previous becomes current to be updated
    [velx_prev, velx] = [velx, velx_prev];
    [vely_prev, vely] = [vely, vely_prev];
    //velocity diffusion
    diffusion(1, velx, velx_prev, visc, dt);
    diffusion(2, vely, vely_prev, visc, dt);
    //remove flux
    projection(velx, vely, plhl_p, plhl_d);
    
    //swap again
    [velx_prev, velx] = [velx, velx_prev];
    [vely_prev, vely] = [vely, vely_prev];
    //velocity self advection
    advection(1, velx, velx_prev, velx_prev, vely_prev, dt);
    advection(2, vely, vely_prev, velx_prev, vely_prev, dt);
    //remove flux
    projection(velx, vely, plhl_p, plhl_d);
}

//the reaction is 2nd degree wrt A and 1st degree for b
function reaction_rate(a, b) {
    return 14.25 * a * a * b;
}

function reaction_step(fa, fb, fc, dt) {
    var i, j, amt, lm;
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            //amount of A and B reacted = rate * time
            amt = reaction_rate(fa[i][j], fb[i][j]) * dt;
            //see if any limited reagent (can't have more reaction than reactants)
            lm = Math.min(fa[i][j], fb[i][j]);
            amt = Math.min(lm, amt);
            //now subtract from A and B and add to C
            fa[i][j] -= amt;
            fb[i][j] -= amt;
            fc[i][j] += amt;
        }
    }
}

//one simulation tick
//code cited directly from [stam 2003]
function simulation_step() {
    //get_input(); //get input from ui (optional for now?)
    velocity_step(dif_f, sec_per_tick); //evolve velocity
    density_step(visc_f, sec_per_tick); //evolve density
    draw_on_canvas(den, main_ctx, 10);   //draw density array on canvas
    
    //optional debug
    console.log("sum of density: " + sum_field(den));
}

var avg_time_taken = 0;
var tick_ct = 0;

//the simulation step for multiple chemicals
function simulation_step_multi() {
    var startTime = performance.now();
    
    //get_input(); //get input from ui (optional for now?)
    velocity_step(dif_f, sec_per_tick); //evolve velocity
    density_step_multi(visc_f, sec_per_tick); //evolve density
    reaction_step(den_a, den_b, den_c, sec_per_tick); //simulate reaction
    
    draw_on_canvas_multi(den_a, den_b, den_c, main_ctx, 10);   //draw density array on canvas
    
    //optional debug
    //console.log("sum of density: " + sum_field(den));

    var endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms
    //console.log("time taken: " + timeDiff);
    
    avg_time_taken = (avg_time_taken * tick_ct + timeDiff) / (tick_ct + 1);
    tick_ct++;
}

