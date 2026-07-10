document.addEventListener('DOMContentLoaded', () => {


    const contenedorProductos = document.getElementById('contenedor-productos');
    const estadoProductos = document.getElementById('estado-productos');

    // USO LA API PUBLICA DE CHEAPSHARK PARA GENERARLOS DINAMICAMENTE
    const API_URL = 'https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=40&pageSize=8&sortBy=Deal%20Rating';

    async function cargarProductos() {
        try {
            estadoProductos.textContent = 'Cargando ofertas...';

            const respuesta = await fetch(API_URL);

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }

            const juegos = await respuesta.json();

            if (!juegos || juegos.length === 0) {
                estadoProductos.textContent = 'No hay ofertas disponibles en este momento.';
                return;
            }

            estadoProductos.textContent = '';
            renderizarProductos(juegos);

        } catch (error) {
            console.error('Error al obtener los productos:', error);
            estadoProductos.textContent = 'No se pudieron cargar las ofertas. Probá recargar la página.';
        }
    }

    function renderizarProductos(juegos) {
        contenedorProductos.innerHTML = '';

        juegos.forEach((juego) => {
            const precioOferta = parseFloat(juego.salePrice).toFixed(2);
            const precioNormal = parseFloat(juego.normalPrice).toFixed(2);
            const hayDescuento = juego.salePrice !== juego.normalPrice;

            const card = document.createElement('article');
            card.classList.add('producto-card');

            card.innerHTML = `
                <img src="${juego.thumb}" alt="Portada de ${juego.title}" loading="lazy">
                <div class="producto-info">
                    <h3>${juego.title}</h3>
                    <div class="producto-precio">
                        <span class="precio-oferta">$${precioOferta}</span>
                        ${hayDescuento ? `<span class="precio-normal">$${precioNormal}</span>` : ''}
                    </div>
                    <button class="btn-agregar" data-id="${juego.dealID}">
                        Agregar al carrito
                    </button>
                </div>
            `;

            const boton = card.querySelector('.btn-agregar');
            boton.addEventListener('click', () => {
                agregarAlCarrito({
                    id: juego.dealID,
                    titulo: juego.title,
                    precio: parseFloat(precioOferta),
                    imagen: juego.thumb
                });

                boton.textContent = 'Agregado ✓';
                boton.disabled = true;
                setTimeout(() => {
                    boton.textContent = 'Agregar al carrito';
                    boton.disabled = false;
                }, 900);
            });

            contenedorProductos.appendChild(card);
        });
    }

    cargarProductos();

    const CLAVE_CARRITO = 'elportalgamer_carrito';

    const btnCarrito = document.getElementById('btn-carrito');
    const modalCarrito = document.getElementById('carrito-modal');
    const cerrarCarritoBtn = document.getElementById('cerrar-carrito');
    const contenedorItems = document.getElementById('carrito-items');
    const carritoVacioMsg = document.getElementById('carrito-vacio');
    const contadorCarrito = document.getElementById('contador-carrito');
    const totalCarritoSpan = document.getElementById('carrito-total');
    const btnVaciarCarrito = document.getElementById('vaciar-carrito');

    function obtenerCarrito() {
        const datos = localStorage.getItem(CLAVE_CARRITO);
        return datos ? JSON.parse(datos) : [];
    }

    function guardarCarrito(carrito) {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    }

    function agregarAlCarrito(producto) {
        const carrito = obtenerCarrito();
        const existente = carrito.find(item => item.id === producto.id);

        if (existente) {
            existente.cantidad += 1;
        } else {
            carrito.push({ ...producto, cantidad: 1 });
        }

        guardarCarrito(carrito);
        renderizarCarrito();
    }

    function actualizarCantidad(id, delta) {
        const carrito = obtenerCarrito();
        const item = carrito.find(item => item.id === id);

        if (!item) return;

        item.cantidad += delta;

        if (item.cantidad <= 0) {
            eliminarDelCarrito(id);
            return;
        }

        guardarCarrito(carrito);
        renderizarCarrito();
    }

    function eliminarDelCarrito(id) {
        let carrito = obtenerCarrito();
        carrito = carrito.filter(item => item.id !== id);
        guardarCarrito(carrito);
        renderizarCarrito();
    }

    function vaciarCarrito() {
        guardarCarrito([]);
        renderizarCarrito();
    }

    function renderizarCarrito() {
        const carrito = obtenerCarrito();

        // Contador en el nav
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        contadorCarrito.textContent = totalItems;

        // Lista de items
        contenedorItems.innerHTML = '';

        if (carrito.length === 0) {
            carritoVacioMsg.style.display = 'block';
        } else {
            carritoVacioMsg.style.display = 'none';

            carrito.forEach((item) => {
                const div = document.createElement('div');
                div.classList.add('carrito-item');

                const subtotal = (item.precio * item.cantidad).toFixed(2);

                div.innerHTML = `
                    <img src="${item.imagen}" alt="${item.titulo}">
                    <div class="carrito-item-info">
                        <h4>${item.titulo}</h4>
                        <p>$${item.precio.toFixed(2)} c/u — Subtotal: $${subtotal}</p>
                        <div class="carrito-item-cantidad">
                            <button class="btn-restar" aria-label="Restar unidad de ${item.titulo}">−</button>
                            <span>${item.cantidad}</span>
                            <button class="btn-sumar" aria-label="Sumar unidad de ${item.titulo}">+</button>
                        </div>
                    </div>
                    <button class="carrito-item-eliminar" aria-label="Eliminar ${item.titulo} del carrito">🗑</button>
                `;

                div.querySelector('.btn-restar').addEventListener('click', () => actualizarCantidad(item.id, -1));
                div.querySelector('.btn-sumar').addEventListener('click', () => actualizarCantidad(item.id, 1));
                div.querySelector('.carrito-item-eliminar').addEventListener('click', () => eliminarDelCarrito(item.id));

                contenedorItems.appendChild(div);
            });
        }

        // Total dinámico
        const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        totalCarritoSpan.textContent = `$${total.toFixed(2)}`;
    }

    function abrirCarrito() {
        modalCarrito.hidden = false;
        cerrarCarritoBtn.focus();
    }

    function cerrarCarrito() {
        modalCarrito.hidden = true;
        btnCarrito.focus();
    }

    btnCarrito.addEventListener('click', abrirCarrito);
    cerrarCarritoBtn.addEventListener('click', cerrarCarrito);
    btnVaciarCarrito.addEventListener('click', vaciarCarrito);

    modalCarrito.addEventListener('click', (evento) => {
        if (evento.target === modalCarrito) {
            cerrarCarrito();
        }
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modalCarrito.hidden) {
            cerrarCarrito();
        }
    });

    renderizarCarrito();

    const formContacto = document.getElementById('form-contacto');
    const campoNombre = document.getElementById('nombre');
    const campoEmail = document.getElementById('email');
    const campoMensaje = document.getElementById('mensaje');
    const confirmacionForm = document.getElementById('confirmacion-form');

    const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function mostrarError(campo, idError, mensaje) {
        const errorSpan = document.getElementById(idError);
        errorSpan.textContent = mensaje;
        campo.classList.toggle('campo-invalido', Boolean(mensaje));
    }

    function validarNombre() {
        const valor = campoNombre.value.trim();
        if (valor === '') {
            mostrarError(campoNombre, 'error-nombre', 'Por favor ingresá tu nombre.');
            return false;
        }
        mostrarError(campoNombre, 'error-nombre', '');
        return true;
    }

    function validarEmail() {
        const valor = campoEmail.value.trim();
        if (valor === '') {
            mostrarError(campoEmail, 'error-email', 'Por favor ingresá tu correo electrónico.');
            return false;
        }
        if (!REGEX_EMAIL.test(valor)) {
            mostrarError(campoEmail, 'error-email', 'El formato del correo no es válido.');
            return false;
        }
        mostrarError(campoEmail, 'error-email', '');
        return true;
    }

    function validarMensaje() {
        const valor = campoMensaje.value.trim();
        if (valor === '') {
            mostrarError(campoMensaje, 'error-mensaje', 'Por favor escribí un mensaje.');
            return false;
        }
        mostrarError(campoMensaje, 'error-mensaje', '');
        return true;
    }

    campoNombre.addEventListener('blur', validarNombre);
    campoEmail.addEventListener('blur', validarEmail);
    campoMensaje.addEventListener('blur', validarMensaje);

    formContacto.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const nombreValido = validarNombre();
        const emailValido = validarEmail();
        const mensajeValido = validarMensaje();

        if (!nombreValido || !emailValido || !mensajeValido) {
            confirmacionForm.textContent = 'Revisá los campos marcados en rojo.';
            confirmacionForm.style.color = '#ff6b6b';
            return;
        }

        try {
            const datosFormulario = new FormData(formContacto);

            const respuesta = await fetch(formContacto.action, {
                method: 'POST',
                body: datosFormulario,
                headers: { 'Accept': 'application/json' }
            });

            if (respuesta.ok) {
                confirmacionForm.textContent = '¡Mensaje enviado con éxito! Te responderemos pronto.';
                confirmacionForm.style.color = '#00ffcc';
                formContacto.reset();
            } else {
                throw new Error('Respuesta no exitosa del servidor');
            }

        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            confirmacionForm.textContent = 'Ocurrió un error al enviar el mensaje. Intentá de nuevo.';
            confirmacionForm.style.color = '#ff6b6b';
        }
    });

});
