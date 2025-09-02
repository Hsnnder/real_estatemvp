// Socket.io connection
const socket = io();

// DOM elements
const propertiesGrid = document.getElementById('propertiesGrid');
const propertyModal = document.getElementById('propertyModal');
const contactModal = document.getElementById('contactModal');
const contactForm = document.getElementById('contactForm');
const propertyCount = document.getElementById('propertyCount');

let properties = [];
let currentPropertyId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadProperties();
    setupEventListeners();
    setupSocketListeners();
});

// Load properties from server
async function loadProperties() {
    try {
        const response = await fetch('/api/properties');
        properties = await response.json();
        displayProperties(properties);
        updatePropertyCount(properties.length);
    } catch (error) {
        console.error('Error loading properties:', error);
        showError('İlanlar yüklenirken hata oluştu');
    }
}

// Display properties in grid
function displayProperties(properties) {
    if (properties.length === 0) {
        propertiesGrid.innerHTML = `
            <div class="no-properties">
                <i class="fas fa-home"></i>
                <h3>Henüz ilan bulunmuyor</h3>
                <p>Yakında yeni ilanlar eklenecektir.</p>
            </div>
        `;
        return;
    }

    const propertyCards = properties.map((property, index) => `
        <div class="property-card" onclick="showPropertyDetail('${property.id}')" style="animation-delay: ${index * 0.1}s">
            <div class="property-image" style="background-image: url('${property.images[0] || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'}')">
                <div class="price-badge">${formatPrice(property.price)}</div>
            </div>
            <div class="property-content">
                <h3 class="property-title">${property.title}</h3>
                <div class="property-features">
                    <div class="feature">
                        <i class="fas fa-bed"></i>
                        <span>${property.rooms} oda</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-bath"></i>
                        <span>${property.bathrooms} banyo</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${property.squareMeters} m²</span>
                    </div>
                </div>
                <p class="property-description">${property.description}</p>
            </div>
            <div class="property-footer">
                <button class="contact-btn" onclick="event.stopPropagation(); showContactForm('${property.id}')">
                    <i class="fas fa-phone"></i>
                    İletişime Geç
                </button>
            </div>
        </div>
    `).join('');

    propertiesGrid.innerHTML = propertyCards;
}

// Show property detail modal
async function showPropertyDetail(propertyId) {
    try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const property = await response.json();
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="property-detail">
                <div class="property-images">
                    ${property.images.map(img => `
                        <img src="${img}" alt="${property.title}" onclick="openImageGallery('${img}')">
                    `).join('')}
                </div>
                <div class="property-info">
                    <h2>${property.title}</h2>
                    <div class="property-price">${formatPrice(property.price)}</div>
                    
                    <div class="property-specs">
                        <div class="spec">
                            <i class="fas fa-bed"></i>
                            <div class="spec-value">${property.rooms}</div>
                            <div class="spec-label">Oda</div>
                        </div>
                        <div class="spec">
                            <i class="fas fa-bath"></i>
                            <div class="spec-value">${property.bathrooms}</div>
                            <div class="spec-label">Banyo</div>
                        </div>
                        <div class="spec">
                            <i class="fas fa-ruler-combined"></i>
                            <div class="spec-value">${property.squareMeters}</div>
                            <div class="spec-label">m²</div>
                        </div>
                    </div>
                    
                    <div class="property-description-full">
                        <h4>Açıklama</h4>
                        <p>${property.description}</p>
                    </div>
                    
                    <button class="btn btn-primary" onclick="showContactForm('${property.id}')">
                        <i class="fas fa-phone"></i>
                        Bu İlan İçin İletişime Geç
                    </button>
                </div>
            </div>
        `;
        
        propertyModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading property details:', error);
        showError('İlan detayları yüklenirken hata oluştu');
    }
}

// Show contact form
function showContactForm(propertyId) {
    currentPropertyId = propertyId;
    document.getElementById('propertyIdInput').value = propertyId;
    contactModal.style.display = 'block';
    propertyModal.style.display = 'none';
    document.body.style.overflow = 'hidden';
}

// Setup event listeners
function setupEventListeners() {
    // Modal close buttons
    document.querySelector('.close').onclick = () => {
        propertyModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    document.querySelector('.close-contact').onclick = () => {
        contactModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    // Close modals when clicking outside
    window.onclick = (event) => {
        if (event.target === propertyModal) {
            propertyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (event.target === contactModal) {
            contactModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // Contact form submission
    contactForm.onsubmit = async (e) => {
        e.preventDefault();
        await submitContactForm();
    };
}

// Setup Socket.io listeners
function setupSocketListeners() {
    socket.on('propertyAdded', (property) => {
        properties.unshift(property);
        displayProperties(properties);
        updatePropertyCount(properties.length);
        showSuccess('Yeni ilan eklendi!');
    });
    
    socket.on('propertyUpdated', (updatedProperty) => {
        const index = properties.findIndex(p => p.id === updatedProperty.id);
        if (index !== -1) {
            properties[index] = updatedProperty;
            displayProperties(properties);
        }
    });
    
    socket.on('propertyDeleted', (propertyId) => {
        properties = properties.filter(p => p.id !== propertyId);
        displayProperties(properties);
        updatePropertyCount(properties.length);
    });
}

// Submit contact form
async function submitContactForm() {
    try {
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message'),
            propertyId: formData.get('propertyId')
        };
        
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Mesajınız başarıyla gönderildi!');
            contactForm.reset();
            contactModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        } else {
            showError(result.error || 'Mesaj gönderilirken hata oluştu');
        }
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showError('Mesaj gönderilirken hata oluştu');
    }
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0
    }).format(price);
}

function updatePropertyCount(count) {
    propertyCount.textContent = count;
}

function showSuccess(message) {
    createNotification(message, 'success');
}

function showError(message) {
    createNotification(message, 'error');
}

function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add notification animations to CSS (we'll add this via JavaScript)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .no-properties {
        text-align: center;
        padding: 60px 20px;
        color: #7f8c8d;
        grid-column: 1 / -1;
    }
    
    .no-properties i {
        font-size: 4rem;
        margin-bottom: 20px;
        color: var(--accent-color);
    }
    
    .no-properties h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
        color: var(--primary-color);
    }
`;
document.head.appendChild(style);