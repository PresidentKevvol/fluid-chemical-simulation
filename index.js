var main_vas;
var main_ctx;

var p;

var sim_grid_width = 120;
var sim_grid_height = 120;
var size = sim_grid_height * sim_grid_width;
/*
function create_field_grid() {
    return nj.zeros([sim_grid_height, sim_grid_width], 'float64');
}
*/
function create_field_grid() {
    var f = [];
    for (i=0; i<sim_grid_width; i++) {
        f.push(new Array(sim_grid_height).fill(0));
    }
    return f;
}

//the field grid for x,y velocity and density
var velx = create_field_grid();
var vely = create_field_grid();
var den = create_field_grid();

//the field grid for x,y velocity and density of the previous tick
var velx_prev = create_field_grid();
var vely_prev = create_field_grid();
var den_prev = create_field_grid();

/*
//reset the boundary to 0 after each processing
function reset_bound(field) {
    for (var i=0; i<sim_grid_width; i++ ) {
        field.set(0, i, 0);
        field.set(sim_grid_height-1, i, 0);
    }
    for (var i=0; i<sim_grid_height; i++ ) {
        field.set(i, sim_grid_width, 0);
        field.set(i, sim_grid_width-1, 0);
    }
}
*/

function add_source(x, s, dt) {
    for (i=1; i<sim_grid_width - 1; i++) {
        for (j=1; j<sim_grid_height - 1; j++) {
            x[i][j] += dt * s[i][j];
        }
    }
}

function reset_bound(b, field) {
    var i, j;
    
    for (i=1; i<sim_grid_width - 1 ; i++) {
        field[i][0]   = (b === 2) ? -field[i][1] : field[i][1];
        field[i][sim_grid_height - 1] = b==2 ? -field[i][sim_grid_height - 1] : field[i][sim_grid_height - 1];
    }
    for (j=1; j<sim_grid_height - 1; j++) {
        field[0][j]   = b==1 ? -field[1][j] : field[1][j];
        field[sim_grid_width - 1][j] = b==1 ? -field[sim_grid_width - 1][j] : field[sim_grid_width - 1][j];
    }
    
    field[0][0] = 0.5*(field[1][0] + field[0][1]);
    field[0][sim_grid_height - 1] = 0.5*(field[1][sim_grid_height - 1] + field[0][sim_grid_height - 2]);
    field[sim_grid_width - 1][0] = 0.5*(field[sim_grid_width - 2][0] + field[sim_grid_width - 1][1]);
    field[sim_grid_width - 1][sim_grid_height - 1] = 0.5*(field[sim_grid_width - 2][sim_grid_height - 1] + field[sim_grid_width - 1][sim_grid_height - 2]);
}

function diffusion(b, f, f_prev, dif, dt) {
    var a = dt * dif * sim_grid_width * sim_grid_height;
    var i, j, k;
    var new_val;
    
    for (k=0; k<20; k++) {
        for (i=1; i<sim_grid_width - 1; i++) {
            for (j=1; j<sim_grid_height - 1; j++) {
                new_val = ( f_prev[i][j] + a * (f[i][j-1] + f[i][j+1] + f[i-1][j] + f[i+1][j]) ) / (1 + 4*a);
                
                f[i][j]= new_val;
            }
        }
    }
    
    reset_bound(b, f);
}

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

function density_step(d, d_prev, vx, vy, dif, dt) {
    diffusion(0, d, d_prev, dif, dt);
    advection(0, d, d_prev, vx, vy, dt);
}

function velocity_step() {
    
}

function simulation_step() {
    
}


const resize_canvas = document.createElement('canvas');
const resize_ctx = resize_canvas.getContext('2d');

function resizeImageData (imageData, width, height) {
  const resizeWidth = width >> 0
  const resizeHeight = height >> 0
  const ibm = window.createImageBitmap(imageData, 0, 0, imageData.width, imageData.height, {
    resizeWidth, resizeHeight
  })
  resize_canvas.width = resizeWidth
  resize_canvas.height = resizeHeight
  resize_ctx.scale(resizeWidth / imageData.width, resizeHeight / imageData.height)
  resize_ctx.drawImage(ibm, 0, 0)
  return resize_ctx.getImageData(0, 0, resizeWidth, resizeHeight)
}

var ctx_h = 1000; var ctx_w = 1000;
//function to draw field on the canvas
function draw_on_canvas(f, vas_ctx) {
    var imd = vas_ctx.createImageData(sim_grid_width, sim_grid_height);
    var idx = 0;
    var i,j;
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            imd.data[idx] = 0;
            imd.data[idx + 1] = 0;
            imd.data[idx + 2] = 255;
            imd.data[idx + 3] = f[i][j] / 10 * 255;
            
            idx += 4;
        }
    }
    //resize it
    //imd = resizeImageData(imd, 1000, 1000);
    //draw on destination canvas
    vas_ctx.putImageData(imd, 0, 0, 0, 0, ctx_w, ctx_h);
}

function generate_random_field() {
    var f = create_field_grid();
    
    var i,j;
    for (i=0; i<sim_grid_width; i++) {
        for (j=0; j<sim_grid_height; j++) {
            f[i][j] = Math.random() * 10;
        }
    }
    
    return f;
}

function ijs_setup() {
    main_vas = document.getElementById("main-vas");
    main_ctx = main_vas.getContext('2d');
    main_ctx.imageSmoothingEnabled = false;
    
    draw_on_canvas(p, main_ctx);

    setInterval(function() {
        var p1 = create_field_grid();
        diffusion(0, p1, p, 0.0005, 0.025);
        p = p1;
        draw_on_canvas(p, main_ctx);
    }, 25);
}

document.addEventListener("DOMContentLoaded", ijs_setup);