// ===== VARIABLES GLOBALES =====
let pendientes = [];
let datosFiltrados = [];
let pendienteEditando = null;
let chartEstados = null;
let chartTipoReunion = null;

// URL base de la API Netlify
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8888/.netlify/functions/pendientes' 
    : '/.netlify/functions/pendientes';

// ===== FUNCIONES DE INICIALIZACIÓN =====
function inicializarFechaHora() {
    const ahora = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = 
        ahora.toLocaleDateString('es-ES', opciones);
}

// ===== FUNCIONES DE INTERFAZ =====
function mostrarLoading(mostrar) {
    document.getElementById('loadingOverlay').style.display = 
        mostrar ? 'flex' : 'none';
}

function mostrarMensaje(texto, tipo = 'success') {
    const div = document.getElementById('statusMessage');
    const iconos = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    div.innerHTML = `
        <div class="message" style="
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            background: ${tipo === 'success' ? '#d4edda' : 
                        tipo === 'error' ? '#f8d7da' : 
                        tipo === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${tipo === 'success' ? '#155724' : 
                    tipo === 'error' ? '#721c24' : 
                    tipo === 'warning' ? '#856404' : '#0c5460'};
            border-left: 4px solid ${tipo === 'success' ? '#28a745' : 
                                 tipo === 'error' ? '#dc3545' : 
                                 tipo === 'warning' ? '#ffc107' : '#17a2b8'};
        ">
            <i class="${iconos[tipo]}"></i>
            <span>${texto}</span>
        </div>
    `;
    
    if (tipo === 'success') {
        setTimeout(() => div.innerHTML = '', 5000);
    }
}

function openTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Mostrar tab seleccionado
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Acciones específicas por tab
    if (tabName === 'dashboard') {
        setTimeout(() => actualizarDashboard(), 100);
    } else if (tabName === 'recordatorios') {
        cargarHistorialRecordatorios();
    }
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function mostrarModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// ===== FUNCIONES DE DATOS =====
async function cargarDatos() {
    mostrarLoading(true);
    
    try {
        const response = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            pendientes = result.data;
            datosFiltrados = [...pendientes];
            mostrarLoading(false);
            actualizarEstadisticas();
            actualizarSemaforoIndicadores();
            renderizarTablaPendientes();
            cargarFiltrosResponsables();
            mostrarMensaje(`✅ ${result.count} pendientes cargados exitosamente`, 'success');
        } else {
            throw new Error(result.error || 'Error al cargar datos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarLoading(false);
        mostrarMensaje('❌ Error al cargar datos: ' + error.message, 'error');
        usarDatosEjemplo();
    }
}

function cargarFiltrosResponsables() {
    const responsables = [...new Set(pendientes.map(p => p.responsable).filter(Boolean))];
    const selectFiltro = document.getElementById('dashboardFilterResponsable');
    const selectResponsable = document.getElementById('filterResponsable');
    
    // Limpiar opciones (excepto la primera)
    while (selectFiltro.options.length > 1) selectFiltro.remove(1);
    while (selectResponsable.options.length > 1) selectResponsable.remove(1);
    
    // Agregar responsables
    responsables.forEach(responsable => {
        const option1 = document.createElement('option');
        option1.value = responsable;
        option1.textContent = responsable;
        selectFiltro.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = responsable;
        option2.textContent = responsable;
        selectResponsable.appendChild(option2);
    });
}

function usarDatosEjemplo() {
    pendientes = [
        {
            id: 'LOG001-1',
            numero: '1',
            tipoReunion: 'Logística',
            numeroActa: 'LOG001',
            fechaReunion: '04/08/2025',
            tipoPendiente: 'Eficiencia Operativa y de Tiempo',
            actividad: 'Programar recepción de despachos semanales',
            descripcion: 'Incluir suministros y materiales críticos',
            solicitante: 'Logística',
            responsable: 'Ángel Arenas',
            observacion: 'Revisar horarios de 9-12 y 2-4:45',
            fechaInicio: '2024-01-10',
            fechaMaxPlazo: '2024-01-25',
            fechaCulminacion: '',
            comentarioResponsable: 'En coordinación con almacén',
            estado: 'EN PROCESO'
        },
        {
            id: 'ALM001-1',
            numero: '1',
            tipoReunion: 'Almacén',
            numeroActa: 'ALM001',
            fechaReunion: '05/08/2025',
            tipoPendiente: 'Cumplimiento de Entregables',
            actividad: 'Reorganización de almacén principal',
            descripcion: 'Optimizar distribución de estanterías',
            solicitante: 'GAF',
            responsable: 'Anthony Zelaya',
            observacion: 'Priorizar zona de materiales peligrosos',
            fechaInicio: '2024-01-05',
            fechaMaxPlazo: '2024-02-15',
            fechaCulminacion: '',
            comentarioResponsable: 'Esperando aprobación de presupuesto',
            estado: 'PENDIENTE'
        }
    ];
    
    datosFiltrados = [...pendientes];
    mostrarLoading(false);
    actualizarEstadisticas();
    actualizarSemaforoIndicadores();
    renderizarTablaPendientes();
    cargarFiltrosResponsables();
    mostrarMensaje(⚠️ Usando datos de ejemplo - Conectado al backend Netlify', 'warning');
}

function actualizarEstadisticas() {
    const total = datosFiltrados.length;
    const pendientesCount = datosFiltrados.filter(p => p.estado === 'PENDIENTE').length;
    const enProcesoCount = datosFiltrados.filter(p => p.estado === 'EN PROCESO').length;
    const terminadosCount = datosFiltrados.filter(p => p.estado === 'TERMINADO').length;
    
    document.getElementById('totalPendientes').textContent = total;
    document.getElementById('pendientesCount').textContent = pendientesCount;
    document.getElementById('enProcesoCount').textContent = enProcesoCount;
    document.getElementById('terminadosCount').textContent = terminadosCount;
}

function actualizarSemaforoIndicadores() {
    const total = datosFiltrados.length;
    const terminados = datosFiltrados.filter(p => p.estado === 'TERMINADO').length;
    const enProceso = datosFiltrados.filter(p => p.estado === 'EN PROCESO').length;
    const pendientesCount = datosFiltrados.filter(p => p.estado === 'PENDIENTE').length;
    
    const eficienciaReal = total > 0 ? ((terminados / total) * 100).toFixed(1) : 0;
    const esfuerzoMarcha = total > 0 ? ((enProceso / total) * 100).toFixed(1) : 0;
    const riesgoAtraso = total > 0 ? ((pendientesCount / total) * 100).toFixed(1) : 0;
    
    document.getElementById('eficienciaReal').textContent = eficienciaReal + '%';
    document.getElementById('esfuerzoMarcha').textContent = esfuerzoMarcha + '%';
    document.getElementById('riesgoAtraso').textContent = riesgoAtraso + '%';
}

function renderizarTablaPendientes() {
    const tbody = document.getElementById('tablaPendientes');
    
    if (datosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 50px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #F7D133; opacity: 0.5;"></i>
                    <div style="margin-top: 20px; font-size: 1.2rem; color: #8E8E8D;">
                        No se encontraron pendientes con los filtros aplicados
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    datosFiltrados.forEach(pendiente => {
        let badgeClass = '';
        let badgeText = '';
        
        switch(pendiente.estado) {
            case 'PENDIENTE':
                badgeClass = 'badge-pendiente';
                badgeText = 'PENDIENTE';
                break;
            case 'EN PROCESO':
                badgeClass = 'badge-proceso';
                badgeText = 'EN PROCESO';
                break;
            case 'TERMINADO':
                badgeClass = 'badge-terminado';
                badgeText = 'TERMINADO';
                break;
        }
        
        html += `
            <tr>
                <td><strong>${pendiente.numero}</strong></td>
                <td><code>${pendiente.numeroActa}</code></td>
                <td><span style="color: #F7D133; font-weight: 600;">${pendiente.tipoReunion}</span></td>
                <td>
                    <div style="font-weight: 600; margin-bottom: 5px;">${pendiente.actividad}</div>
                    <div style="font-size: 0.85rem; color: #8E8E8D;">${pendiente.tipoPendiente}</div>
                </td>
                <td>
                    <span style="background: #E8F4FD; color: #3498DB; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">
                        ${pendiente.solicitante}
                    </span>
                </td>
                <td style="font-weight: 600;">${pendiente.responsable}</td>
                <td>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </td>
                <td>${pendiente.fechaInicio || '--'}</td>
                <td>
                    ${pendiente.fechaMaxPlazo || '--'}
                    ${pendiente.fechaMaxPlazo ? `<div style="font-size: 0.8rem; color: #8E8E8D;">Plazo máximo</div>` : ''}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="verDetalles('${pendiente.id}')" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="editarPendiente('${pendiente.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarPendienteConfirmar('${pendiente.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ===== FUNCIONES DE FILTRADO =====
function applyFilters() {
    const busqueda = document.getElementById('searchInput').value.toLowerCase();
    const tipoReunion = document.getElementById('filterTipoReunion').value;
    const estado = document.getElementById('filterEstado').value;
    const solicitante = document.getElementById('filterSolicitante').value;
    const responsable = document.getElementById('filterResponsable').value;
    const tipoPendiente = document.getElementById('editTipoPendiente').value;
    
    datosFiltrados = pendientes.filter(pendiente => {
        let coincide = true;
        
        // Búsqueda general
        if (busqueda) {
            coincide = coincide && (
                pendiente.actividad.toLowerCase().includes(busqueda) ||
                pendiente.descripcion.toLowerCase().includes(busqueda) ||
                pendiente.responsable.toLowerCase().includes(busqueda) ||
                pendiente.numeroActa.toLowerCase().includes(busqueda)
            );
        }
        
        // Filtros específicos
        if (tipoReunion !== 'all') {
            coincide = coincide && pendiente.tipoReunion === tipoReunion;
        }
        
        if (estado !== 'all') {
            coincide = coincide && pendiente.estado === estado;
        }
        
        if (solicitante !== 'all') {
            coincide = coincide && pendiente.solicitante === solicitante;
        }
        
        if (responsable !== 'all') {
            coincide = coincide && pendiente.responsable === responsable;
        }
        
        if (tipoPendiente !== 'all') {
            coincide = coincide && pendiente.tipoPendiente === tipoPendiente;
        }
        
        return coincide;
    });
    
    actualizarEstadisticas();
    actualizarSemaforoIndicadores();
    renderizarTablaPendientes();
    mostrarMensaje(`🔍 ${datosFiltrados.length} pendientes encontrados`, 'success');
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTipoReunion').value = 'all';
    document.getElementById('filterEstado').value = 'all';
    document.getElementById('filterSolicitante').value = 'all';
    document.getElementById('filterResponsable').value = 'all';
    
    datosFiltrados = [...pendientes];
    actualizarEstadisticas();
    actualizarSemaforoIndicadores();
    renderizarTablaPendientes();
    mostrarMensaje('🔄 Filtros restablecidos', 'success');
}

function filtrarPorEstado(estado) {
    if (estado === 'all') {
        datosFiltrados = [...pendientes];
    } else {
        datosFiltrados = pendientes.filter(p => p.estado === estado);
    }
    
    renderizarTablaPendientes(datosFiltrados);
    actualizarEstadisticas();
    actualizarSemaforoIndicadores();
    
    mostrarMensaje(`📊 Filtrado por estado: ${estado}`, 'success');
}

// ===== FUNCIONES DE GESTIÓN =====
function mostrarFormularioNuevo() {
    pendienteEditando = null;
    document.getElementById('modalEditarTitulo').innerHTML = '<i class="fas fa-plus-circle"></i> NUEVO PENDIENTE';
    document.getElementById('btnEliminarPendiente').style.display = 'none';
    
    // Resetear formulario
    const form = document.getElementById('formEditarPendiente');
    if (form) form.reset();
    
    mostrarModal('modalEditar');
}

async function verDetalles(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const pendiente = result.data;
            let badgeClass = '';
            switch(pendiente.estado) {
                case 'PENDIENTE': badgeClass = 'badge-pendiente'; break;
                case 'EN PROCESO': badgeClass = 'badge-proceso'; break;
                case 'TERMINADO': badgeClass = 'badge-terminado'; break;
            }
            
            const contenido = `
                <div style="display: grid; gap: 20px;">
                    <div style="background: #F8F9FA; padding: 20px; border-radius: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #2C3E50;">${pendiente.actividad}</h3>
                            <span class="badge ${badgeClass}" style="font-size: 1rem;">${pendiente.estado}</span>
                        </div>
                        <div style="color: #8E8E8D; margin-bottom: 10px;">${pendiente.tipoPendiente}</div>
                        <p style="margin: 0; line-height: 1.6;">${pendiente.descripcion || 'Sin descripción adicional'}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">ACTA</div>
                            <div style="font-weight: 600; font-size: 1rem;">${pendiente.numeroActa}</div>
                        </div>
                        
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">TIPO DE REUNIÓN</div>
                            <div style="font-weight: 600; font-size: 1rem; color: #F7D133;">${pendiente.tipoReunion}</div>
                        </div>
                        
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">FECHA REUNIÓN</div>
                            <div style="font-weight: 600; font-size: 1rem;">${pendiente.fechaReunion}</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">SOLICITANTE</div>
                            <div style="font-weight: 600; font-size: 1rem;">${pendiente.solicitante}</div>
                        </div>
                        
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">RESPONSABLE</div>
                            <div style="font-weight: 600; font-size: 1rem;">${pendiente.responsable}</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">FECHA INICIO</div>
                            <div style="font-weight: 600; font-size: 1rem;">${pendiente.fechaInicio || 'No definida'}</div>
                        </div>
                        
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">FECHA MÁXIMA</div>
                            <div style="font-weight: 600; font-size: 1rem;">${pendiente.fechaMaxPlazo || 'No definida'}</div>
                        </div>
                        
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #E8E8E8;">
                            <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 5px;">FECHA CULMINACIÓN</div>
                            <div style="font-weight: 600; font-size: 1rem;">${pendiente.fechaCulminacion || 'En progreso'}</div>
                        </div>
                    </div>
                    
                    ${pendiente.observacion ? `
                    <div style="background: #FFF9E6; padding: 15px; border-radius: 10px; border-left: 4px solid #F7D133;">
                        <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 10px;">OBSERVACIONES</div>
                        <p style="margin: 0; line-height: 1.6;">${pendiente.observacion}</p>
                    </div>
                    ` : ''}
                    
                    ${pendiente.comentarioResponsable ? `
                    <div style="background: #E6F4FF; padding: 15px; border-radius: 10px; border-left: 4px solid #3498DB;">
                        <div style="font-size: 0.85rem; color: #8E8E8D; margin-bottom: 10px;">COMENTARIO DEL RESPONSABLE</div>
                        <p style="margin: 0; line-height: 1.6;">${pendiente.comentarioResponsable}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('modalDetallesTitulo').innerHTML = 
                `<i class="fas fa-info-circle"></i> ${pendiente.actividad}`;
            document.getElementById('modalDetallesContenido').innerHTML = contenido;
            
            // Guardar ID para edición
            document.getElementById('modalDetallesContenido').dataset.pendienteId = id;
            
            mostrarModal('modalDetalles');
        } else {
            throw new Error(result.error || 'Error al cargar detalles');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al cargar detalles: ' + error.message, 'error');
    }
}

function editarPendienteActual() {
    const id = document.getElementById('modalDetallesContenido').dataset.pendienteId;
    if (id) {
        cerrarModal('modalDetalles');
        setTimeout(() => editarPendiente(id), 300);
    }
}

async function editarPendiente(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const pendiente = result.data;
            pendienteEditando = pendiente;
            
            document.getElementById('modalEditarTitulo').innerHTML = 
                `<i class="fas fa-edit"></i> EDITAR PENDIENTE`;
            document.getElementById('btnEliminarPendiente').style.display = 'inline-flex';
            
            // Llenar formulario
            document.getElementById('editTipoPendiente').value = pendiente.tipoPendiente;
            document.getElementById('editTipoReunion').value = pendiente.tipoReunion;
            document.getElementById('editActividad').value = pendiente.actividad;
            document.getElementById('editDescripcion').value = pendiente.descripcion || '';
            document.getElementById('editSolicitante').value = pendiente.solicitante;
            document.getElementById('editResponsable').value = pendiente.responsable;
            document.getElementById('editFechaInicio').value = pendiente.fechaInicio || '';
            document.getElementById('editFechaMaxPlazo').value = pendiente.fechaMaxPlazo || '';
            document.getElementById('editFechaCulminacion').value = pendiente.fechaCulminacion || '';
            document.getElementById('editObservacion').value = pendiente.observacion || '';
            document.getElementById('editComentarioResponsable').value = pendiente.comentarioResponsable || '';
            document.getElementById('editEstado').value = pendiente.estado;
            
            mostrarModal('modalEditar');
        } else {
            throw new Error(result.error || 'Error al cargar pendiente');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al cargar pendiente: ' + error.message, 'error');
    }
}

async function guardarPendiente() {
    const form = document.getElementById('formEditarPendiente');
    
    if (!form.checkValidity()) {
        mostrarMensaje('❌ Por favor completa todos los campos obligatorios', 'error');
        return;
    }
    
    const pendienteData = {
        tipoPendiente: document.getElementById('editTipoPendiente').value,
        tipoReunion: document.getElementById('editTipoReunion').value,
        actividad: document.getElementById('editActividad').value,
        descripcion: document.getElementById('editDescripcion').value,
        solicitante: document.getElementById('editSolicitante').value,
        responsable: document.getElementById('editResponsable').value,
        fechaInicio: document.getElementById('editFechaInicio').value,
        fechaMaxPlazo: document.getElementById('editFechaMaxPlazo').value,
        fechaCulminacion: document.getElementById('editFechaCulminacion').value,
        observacion: document.getElementById('editObservacion').value,
        comentarioResponsable: document.getElementById('editComentarioResponsable').value,
        estado: document.getElementById('editEstado').value
    };
    
    try {
        let response;
        
        if (pendienteEditando) {
            // Actualizar pendiente existente
            response = await fetch(`${API_URL}/${pendienteEditando.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pendienteData)
            });
        } else {
            // Crear nuevo pendiente
            response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pendienteData)
            });
        }
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje(`✅ ${pendienteEditando ? 'Pendiente actualizado' : 'Pendiente creado'} correctamente`, 'success');
            cerrarModal('modalEditar');
            cargarDatos();
        } else {
            throw new Error(result.error || 'Error al guardar pendiente');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al guardar pendiente: ' + error.message, 'error');
    }
}

async function eliminarPendienteConfirmar(id) {
    if (confirm('¿Estás seguro de eliminar este pendiente? Esta acción no se puede deshacer.')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                mostrarMensaje('✅ Pendiente eliminado correctamente', 'success');
                cargarDatos();
            } else {
                throw new Error(result.error || 'Error al eliminar pendiente');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('❌ Error al eliminar pendiente: ' + error.message, 'error');
        }
    }
}

function eliminarPendiente() {
    if (pendienteEditando && confirm('¿Estás seguro de eliminar este pendiente? Esta acción no se puede deshacer.')) {
        eliminarPendienteConfirmar(pendienteEditando.id);
        cerrarModal('modalEditar');
    }
}

// ===== FUNCIONES DEL DASHBOARD =====
function actualizarDashboard() {
    // Obtener filtro de responsable
    const responsableFiltro = document.getElementById('dashboardFilterResponsable').value;
    let datosDashboard = pendientes;
    
    if (responsableFiltro !== 'all') {
        datosDashboard = pendientes.filter(p => p.responsable === responsableFiltro);
    }
    
    // Actualizar estadísticas del dashboard
    const total = datosDashboard.length;
    const pendientesCount = datosDashboard.filter(p => p.estado === 'PENDIENTE').length;
    const enProceso = datosDashboard.filter(p => p.estado === 'EN PROCESO').length;
    const terminados = datosDashboard.filter(p => p.estado === 'TERMINADO').length;
    
    document.getElementById('dashboardTotal').textContent = total;
    document.getElementById('dashboardPendientes').textContent = pendientesCount;
    document.getElementById('dashboardEnProceso').textContent = enProceso;
    document.getElementById('dashboardTerminados').textContent = terminados;
    
    // Crear gráficos
    crearGraficoEstados(datosDashboard);
    crearGraficoTipoReunion(datosDashboard);
}

function crearGraficoEstados(datos) {
    const ctx = document.getElementById('chartEstados').getContext('2d');
    
    if (chartEstados) {
        chartEstados.destroy();
    }
    
    const conteoEstados = {
        'PENDIENTE': datos.filter(p => p.estado === 'PENDIENTE').length,
        'EN PROCESO': datos.filter(p => p.estado === 'EN PROCESO').length,
        'TERMINADO': datos.filter(p => p.estado === 'TERMINADO').length
    };
    
    chartEstados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'En Proceso', 'Terminados'],
            datasets: [{
                data: [conteoEstados.PENDIENTE, conteoEstados.EN_PROCESO, conteoEstados.TERMINADO],
                backgroundColor: ['#F39C12', '#3498DB', '#2ECC71'],
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function crearGraficoTipoReunion(datos) {
    const ctx = document.getElementById('chartTipoReunion').getContext('2d');
    
    if (chartTipoReunion) {
        chartTipoReunion.destroy();
    }
    
    const tipos = {};
    datos.forEach(p => {
        tipos[p.tipoReunion] = (tipos[p.tipoReunion] || 0) + 1;
    });
    
    chartTipoReunion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(tipos),
            datasets: [{
                label: 'Cantidad de Pendientes',
                data: Object.values(tipos),
                backgroundColor: '#F7D133',
                borderColor: '#E6B800',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ===== FUNCIONES ADICIONALES =====
async function exportarExcel() {
    try {
        const filtros = {
            tipoReunion: document.getElementById('filterTipoReunion').value,
            estado: document.getElementById('filterEstado').value,
            responsable: document.getElementById('filterResponsable').value,
            tipoExportacion: 'todos'
        };
        
        const response = await fetch(`${API_URL}/exportar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filtros)
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        // Descargar el archivo CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pendientes_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        mostrarMensaje('✅ Archivo Excel generado exitosamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al exportar a Excel: ' + error.message, 'error');
    }
}

async function enviarRecordatorios() {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_URL}/recordatorios/enviar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                destinatarios: 'Todos los responsables',
                fecha: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('✅ Recordatorios enviados correctamente', 'success');
            cargarHistorialRecordatorios();
        } else {
            throw new Error(result.error || 'Error al enviar recordatorios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al enviar recordatorios: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function cargarHistorialRecordatorios() {
    try {
        const response = await fetch(`${API_URL}/recordatorios`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('historialRecordatorios');
            const historial = result.data || [];
            
            if (historial.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px;">
                            <i class="fas fa-envelope" style="font-size: 3rem; color: #F7D133; opacity: 0.5;"></i>
                            <div style="margin-top: 20px; color: #8E8E8D;">No hay historial de recordatorios</div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = '';
            historial.forEach(recordatorio => {
                const fecha = new Date(recordatorio.fecha).toLocaleString('es-ES');
                const estadoClass = recordatorio.estado === 'enviado' ? 'badge-terminado' : 'badge-pendiente';
                
                html += `
                    <tr>
                        <td>${fecha}</td>
                        <td>${recordatorio.destinatarios}</td>
                        <td>${recordatorio.cantidadPendientes}</td>
                        <td><span class="badge ${estadoClass}">${recordatorio.estado.toUpperCase()}</span></td>
                        <td>${recordatorio.mensaje || '--'}</td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
        } else {
            throw new Error(result.error || 'Error al cargar historial');
        }
    } catch (error) {
        console.error('Error:', error);
        const tbody = document.getElementById('historialRecordatorios');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div style="margin-top: 20px;">Error al cargar historial: ${error.message}</div>
                </td>
            </tr>
        `;
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    inicializarFechaHora();
    cargarDatos();
    
    // Actualizar fecha cada minuto
    setInterval(inicializarFechaHora, 60000);
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
    
    // Cerrar modales haciendo click fuera
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Buscar al presionar Enter
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
});
