// --- CONFIGURACIÓN DEL FRONTEND ---
const APPS_SCRIPT_WEB_APP_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL'; // ¡Reemplaza con la URL que copiaste de Google Apps Script!
const YOUR_DOMAIN = 'tudominio.com/reservas/'; // Reemplaza con la URL base donde desplegarás tu página
const WRITE_SECRET_KEY_CLIENTSIDE = 'YOUR_VERY_SECRET_KEY_CLIENTSIDE'; // ¡Reemplaza con la MISMA clave que usaste en Apps Script!

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const clientView = document.getElementById('client-view');
const barberConfigView = document.getElementById('barber-config-view');
const barberiaNombre = document.getElementById('barberia-nombre');
const whatsappButton = document.getElementById('whatsapp-button');
const barberiaHorario = document.getElementById('barberia-horario'); // Referencia al nuevo elemento

const barberIdInput = document.getElementById('barber-id');
const whatsappNumberInput = document.getElementById('whatsapp-number');
const barberNameInput = document.getElementById('barber-name');
const barberScheduleInput = document.getElementById('barber-schedule'); // Referencia al nuevo input
const saveConfigButton = document.getElementById('save-config-button');
const saveStatus = document.getElementById('save-status');
const shareLink = document.getElementById('share-link');
const copyLinkButton = document.getElementById('copy-link-button');
const secretKeyInput = document.getElementById('secret-key');

// --- FUNCIONES ---

// Función para mostrar una vista y ocultar la otra
function showView(viewId) {
    clientView.classList.remove('active');
    barberConfigView.classList.remove('active');
    document.getElementById(viewId).classList.add('active');
}

// Función para obtener parámetros de la URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Función para cargar los datos del barbero desde Google Apps Script (para la vista del cliente)
async function loadBarberData(barberoId) {
    saveStatus.textContent = 'Cargando datos del barbero...';
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?barberoId=${barberoId}`);
        const data = await response.json();

        if (data.success) {
            saveStatus.textContent = ''; // Limpiar mensaje de carga
            barberiaNombre.textContent = data.data.nombre || 'Barbería';
            barberiaHorario.textContent = data.data.horario || ''; // Mostrar horario
            // Configurar el botón de WhatsApp
            const whatsappNumber = data.data.whatsapp;
            if (whatsappNumber) {
                 // Genera el enlace de WhatsApp. Puedes añadir texto predefinido aquí.
                 // const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}?text=${encodeURIComponent('Quisiera agendar una cita.')}`;
                 // O simplemente el enlace al número
                 const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\+/g, '')}`; // Remueve el "+" si es necesario para wa.me
                 whatsappButton.onclick = () => { window.open(whatsappLink, '_blank'); };
                 whatsappButton.style.display = 'block'; // Mostrar el botón si hay número
            } else {
                 whatsappButton.style.display = 'none'; // Ocultar si no hay número
                 barberiaNombre.textContent += ' (Configuración incompleta)'; // Indicar que falta info
            }

        } else {
            saveStatus.textContent = `Error: ${data.message}. Verifica el ID del barbero.`;
            barberiaNombre.textContent = 'Barbería No Encontrada';
            whatsappButton.style.display = 'none';
             barberiaHorario.textContent = '';
        }
    } catch (error) {
        saveStatus.textContent = 'Error al conectar con el servidor: ' + error.message;
        barberiaNombre.textContent = 'Error de Carga';
         whatsappButton.style.display = 'none';
         barberiaHorario.textContent = '';
        console.error('Error fetching barber data:', error);
    }
}

// Función para guardar la configuración del barbero en Google Apps Script
async function saveBarberConfig() {
    const id = barberIdInput.value.trim();
    const whatsapp = whatsappNumberInput.value.trim();
    const nombre = barberNameInput.value.trim();
    const horario = barberScheduleInput.value.trim(); // Obtener el horario
    const secretKey = secretKeyInput.value; // Obtener la clave secreta

    if (!id || !whatsapp || !nombre || !secretKey) {
        saveStatus.textContent = 'El ID, WhatsApp, Nombre y la clave secreta son obligatorios.';
        return;
    }
     if (!whatsapp.startsWith('+') || whatsapp.length < 10) {
         saveStatus.textContent = 'Número de WhatsApp inválido. Usa formato internacional (+CódigoPaisNumero).';
         return;
     }
     if (secretKey !== WRITE_SECRET_KEY_CLIENTSIDE) {
          saveStatus.textContent = 'Error: Clave secreta incorrecta.';
          console.error('Attempted save with incorrect secret key');
          return;
     }


    saveStatus.textContent = 'Guardando configuración...';
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', // Importante para CORS
            headers: {
                'Content-Type': 'text/plain', // Apps Script a menudo espera text/plain para JSON
            },
            body: JSON.stringify({ // Enviamos los datos como JSON
                id: id,
                whatsapp: whatsapp,
                nombre: nombre,
                horario: horario, // Incluir el horario
                secretKey: secretKey // Incluir la clave secreta (¡Recuerda la advertencia de seguridad!)
            })
        });

        const data = await response.json();

        if (data.success) {
            saveStatus.textContent = data.message + '. Enlace generado:';
            const barberShareUrl = `${window.location.origin}${window.location.pathname}?barbero=${encodeURIComponent(id)}`;
            shareLink.textContent = barberShareUrl;
            shareLink.href = barberShareUrl;
            copyLinkButton.style.display = 'inline-block'; // Mostrar botón de copiar
        } else {
            saveStatus.textContent = `Error al guardar: ${data.message}`;
            shareLink.textContent = 'Error al generar enlace.';
             copyLinkButton.style.display = 'none';
        }
    } catch (error) {
        saveStatus.textContent = 'Error al conectar con el servidor al guardar: ' + error.message;
         shareLink.textContent = 'Error al generar enlace.';
         copyLinkButton.style.display = 'none';
        console.error('Error saving barber data:', error);
    }
}

// Función para copiar el enlace al portapapeles
function copyShareLink() {
    const textToCopy = shareLink.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Enlace copiado al portapapeles: ' + textToCopy);
    }).catch(err => {
        console.error('Error al copiar el enlace: ', err);
        alert('Error al copiar el enlace.');
    });
}


// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    const barberoIdFromUrl = getUrlParameter('barbero');

    if (barberoIdFromUrl) {
        // Si hay un ID de barbero en la URL, mostramos la vista del cliente
        showView('client-view');
        loadBarberData(barberoIdFromUrl); // Cargar los datos del barbero
    } else {
        // Si no hay ID en la URL, mostramos la vista de configuración por defecto
        // O podrías mostrar una página de bienvenida general.
        showView('barber-config-view');
        saveStatus.textContent = 'Ingresa tus datos y clave secreta para configurar.';
        // Puedes precargar un ID si quieres, o dejar que el barbero lo elija/ingrese
        // barberIdInput.value = 'algún_id_por_defecto';
    }

    // Evento para activar la vista de configuración (ej: doble clic en el h1 del cliente)
    // Asegúrate de que este elemento solo sea visible/doble-clickable para el barbero
    // Una mejor forma sería tener una URL de acceso a la configuración separada, pero siguiendo tu idea:
    barberiaNombre.addEventListener('dblclick', () => {
        showView('barber-config-view');
         saveStatus.textContent = 'Modo configuración activado. Carga tus datos o ingresa nuevos.';
         // Opcional: intentar cargar datos existentes si el barbero ya configuró antes en este navegador (usando localStorage aquí sí tendría sentido SOLO para recordar el ID)
          const lastBarberId = localStorage.getItem('lastBarberConfigId');
          if (lastBarberId) {
               barberIdInput.value = lastBarberId;
               // Podrías añadir lógica aquí para intentar cargar esa config desde la hoja
               // si el ID ya existe, para que el barbero vea sus datos actuales.
          }
    });


    // Evento para el botón Guardar en la vista de configuración
    saveConfigButton.addEventListener('click', saveBarberConfig);

    // Evento para el botón Copiar Enlace
    copyLinkButton.addEventListener('click', copyShareLink);
});