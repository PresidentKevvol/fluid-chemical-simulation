//add source, reset boundary, diffuse, advect, and project function
//used in the simulation
//code cited directly from [stam 2003] and modified to javascript
function add_source(x, s, dt) {
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            x[i][j] += dt * s[i][j];
        }
    }
}

//field will be changed
function reset_bound(b, field) {
    if (b === -1) {
        return;
    }
    
    var i, j;
    
    for (i=1; i<sim_grid_width - 1 ; i++) {
        field[i][0]   = (b === 2) ? -field[i][1] : field[i][1];
        field[i][sim_grid_height - 1] = (b === 2) ? -field[i][sim_grid_height - 2] : field[i][sim_grid_height - 2];
    }
    for (j=1; j<sim_grid_height - 1; j++) {
        field[0][j]   = (b === 1) ? -field[1][j] : field[1][j];
        field[sim_grid_width - 1][j] = (b === 1) ? -field[sim_grid_width - 2][j] : field[sim_grid_width - 2][j];
    }
    
    field[0][0] = 0.5*(field[1][0] + field[0][1]);
    field[0][sim_grid_height - 1] = 0.5*(field[1][sim_grid_height - 1] + field[0][sim_grid_height - 2]);
    field[sim_grid_width - 1][0] = 0.5*(field[sim_grid_width - 2][0] + field[sim_grid_width - 1][1]);
    field[sim_grid_width - 1][sim_grid_height - 1] = 0.5*(field[sim_grid_width - 2][sim_grid_height - 1] + field[sim_grid_width - 1][sim_grid_height - 2]);
}

//f will be changed
function diffusion(b, f, f_prev, dif, dt) {
    var a = dt * dif * sim_grid_width * sim_grid_height;
    var i, j, k, m, n;
    var new_val;
    
    for (k=0; k<20; k++) {
        for (i=1; i<sim_grid_width - 1; i++) {
            for (j=1; j<sim_grid_height - 1; j++) {
                new_val = ( f_prev[i][j] + a * (f[i][j-1] + f[i][j+1] + f[i-1][j] + f[i+1][j]) ) / (1 + 4*a);
                
                f[i][j]= new_val;
            }
        }
        /*
        m = sim_grid_height - 1;
        for (i=1; i<sim_grid_width - 1; i++) {
            f[i][0] = ( f_prev[i][0] + a * (f[i][1] + f[i-1][0] + f[i+1][0]) ) / (1 + 3*a);
            f[i][m] = ( f_prev[i][m] + a * (f[i][m-1] + f[i-1][m] + f[i+1][m]) ) / (1 + 3*a);
        }
        
        n = sim_grid_width - 1;
        for (j=1; j<sim_grid_height - 1; j++) {
            f[0][j] = ( f_prev[0][j] + a * (f[1][j] + f[0][j-1] + f[0][j+1]) ) / (1 + 3*a);
            f[n][j] = ( f_prev[n][j] + a * (f[n-1][j] + f[n][j-1] + f[n][j+1]) ) / (1 + 3*a);
        }
        
        f[0][0] = ( f_prev[0][0] + a * (f[1][0] + f[0][1]) ) / (1 + 2*a);
        f[n][0] = ( f_prev[n][0] + a * (f[n-1][0] + f[n][1]) ) / (1 + 2*a);
        f[0][m] = ( f_prev[0][m] + a * (f[1][m] + f[0][m-1]) ) / (1 + 2*a);
        f[n][m] = ( f_prev[n][m] + a * (f[n-1][m] + f[n][m-1]) ) / (1 + 2*a);
        */
    
        reset_bound(b, f);
    }
    
    

    //return f;
}

//f will be changed
/*
function advection(b, f, f_prev, vel_x, vel_y, dt) {
    var x, y, s0, t0, s1, t1, dt0_x, dt0_y;
    var i, j;
    var new_val;
    
    dt0_x = dt * sim_grid_width;
    dt0_y = dt * sim_grid_height;
    
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            //get advection source location for this cell
            x = i - dt0_x * vel_x[i][j];
            y = j - dt0_y * vel_y[i][j];
            
            //bound/clamp values
            if (x < 0.5) { x = 0.5; }
            if (x > sim_grid_width - 0.5) { x = sim_grid_width - 0.5; }
            if (y < 0.5) { y = 0.5; }
            if (y > sim_grid_height - 0.5) { y = sim_grid_height - 0.5; }
            
            i0 = Math.floor(x);
            i1 = i0 + 1;
            j0 = Math.floor(y);
            j1 = j0 + 1;
        
            s1 = x-i0;
            s0 = 1-s1;
            t1 = y-j0;
            t0 = 1-t1;
            
            new_val = s0 * (t0*f_prev[i0][j0] + t1*f_prev[i0][j1]) + s1 * (t0*f_prev[i1][j0] + t1*f_prev[i1][j1]);
            f[i][j] = new_val;
        }
    }
    
    reset_bound(b, f);
}
*/
//alternate advection function
function advection(b, f, f_prev, vel_x, vel_y, dt) {
    var x, y, s0, t0, s1, t1, dt0_x, dt0_y;
    var i, j;
    var new_val;
    
    dt0_x = dt * sim_grid_width;
    dt0_y = dt * sim_grid_height;
    
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            f[i][j] = 0;
        }
    }

    for (i=1; i<sim_grid_width-1; i++) {
        for (j=1; j<sim_grid_height-1; j++) {
            //get advection destination location for this cell
            //(where is the velocity pointer pointing to?)
            x = i + dt0_x * vel_x[i][j];
            y = j + dt0_y * vel_y[i][j];
            
            //bound/clamp values
            if (x < 0.5) { x = 0.5; }
            if (x > sim_grid_width - 1.5) { x = sim_grid_width - 1.5; }
            if (y < 0.5) { y = 0.5; }
            if (y > sim_grid_height - 1.5) { y = sim_grid_height - 1.5; }
            
            i0 = Math.floor(x);
            i1 = i0 + 1;
            j0 = Math.floor(y);
            j1 = j0 + 1;
        
            s1 = x-i0;
            s0 = 1-s1;
            t1 = y-j0;
            t0 = 1-t1;
            
            //console.log(i0 + " " + i1 + " " + j0 + " " + j1);
            
            //f[i][j] = s0 * (t0*f_prev[i0][j0] + t1*f_prev[i0][j1]) + s1 * (t0*f_prev[i1][j0] + t1*f_prev[i1][j1]);
            f[i0][j0] += s0 * t0 * f_prev[i][j];
            f[i0][j1] += s0 * t1 * f_prev[i][j];
            f[i1][j0] += s1 * t0 * f_prev[i][j];
            f[i1][j1] += s1 * t1 * f_prev[i][j];
        }
    }
    
    reset_bound(b, f);
}

//vx, vy will be changed
function projection(vx, vy, p, div) {
    var i, j, k; var h = 1.0 / sim_grid_height;

    //calculating divergence
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            div[i][j] = -0.5 * h * (vx[i+1][j] - vx[i-1][j] + vy[i][j+1] - vy[i][j-1]);
            p[i][j] = 0;
        }
    }
    reset_bound(0, div);
    reset_bound(0, p);
    
    //Gauss-Seidel relaxation for getting the divergence only field
    for (k=0; k<20; k++) {
        for (i=1; i<sim_grid_width - 1; i++) {
            for (j=1; j<sim_grid_height - 1; j++) {
                p[i][j] = (div[i][j] + p[i-1][j] + p[i+1][j]+ p[i][j-1] + p[i][j+1]) / 4;
            }
        }
        reset_bound(0, p);
    }

    //subtract
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            vx[i][j] -= 0.5 * (p[i+1][j] - p[i-1][j]) / h;
            vy[i][j] -= 0.5 * (p[i][j+1] - p[i][j-1]) / h;
        }
    }
    reset_bound(1, vx);
    reset_bound(2, vy);
}
