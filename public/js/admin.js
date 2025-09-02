// Socket.io connection
const socket = io();

// DOM elements
const propertyForm = document.getElementById('propertyForm');
const adminPropertiesList = document.getElementById('adminPropertiesList');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const imageInput = document.getElementById('images');
const imagePreview = document.getElementById('imagePreview');

let allProperties = [];
let currentEditProperty = null;

// Get auth token
function getAuthToken() {
    return localStorage.getItem('adminToken');
}

// Get auth headers
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!getAuthToken()) {
        window.location.href = '/login';
        return;
    }
    
    loadAllProperties();
    setupEventListeners();
    setupSocketListeners();
    setupImagePreview();
});

// Load all properties (including inactive ones)
async function loadAllProperties() {
    try {
        const response = await fetch('/api/admin/properties', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
            return;
        }
        
        allProperties = await response.json();
        displayAdminProperties(allProperties);
    } catch (error) {
        console.error('Error loading properties:', error);
        showError('İlanlar yüklenirken hata oluştu');
    }
}

// Display properties in admin list
function displayAdminProperties(properties) {
    if (properties.length === 0) {
        adminPropertiesList.innerHTML = `
            <div class="no-properties">
                <i class="fas fa-home"></i>
                <h3>Henüz ilan bulunmuyor</h3>
                <p>İlk ilanınızı eklemek için yukarıdaki formu kullanın.</p>
            </div>
        `;
        return;
    }

    const propertyCards = properties.map(property => `
        <div class="admin-property-card">
            <div class="admin-property-header">
                <h4 class="admin-property-title">${property.title}</h4>
                <span class="property-status ${property.isActive ? 'status-active' : 'status-inactive'}">
                    ${property.isActive ? 'Aktif' : 'Pasif'}
                </span>
            </div>
            
            <div class="admin-property-info">
                <div><strong>Fiyat:</strong> ${formatPrice(property.price)}</div>
                <div><strong>Oda:</strong> ${property.rooms}</div>
                <div><strong>Banyo:</strong> ${property.bathrooms}</div>
                <div><strong>m²:</strong> ${property.squareMeters}</div>
            </div>
            
            <div class="admin-property-description">
                ${property.description.length > 100 ? property.description.substring(0, 100) + '...' : property.description}
            </div>
            
            <div class="admin-property-actions">
                <button class="btn btn-small btn-edit" onclick="editProperty('${property.id}')">
                    <i class="fas fa-edit"></i>
                    Düzenle
                </button>
                <button class="btn btn-small btn-delete" onclick="deleteProperty('${property.id}', '${property.title}')">
                    <i class="fas fa-trash"></i>
                    Sil
                </button>
            </div>
        </div>
    `).join('');

    adminPropertiesList.innerHTML = propertyCards;
}

// Setup event listeners
function setupEventListeners() {
    // Property form submission
    propertyForm.onsubmit = async (e) => {
        e.preventDefault();
        await submitPropertyForm();
    };
    
    // Edit modal close
    document.querySelector('.close-edit').onclick = () => {
        editModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    // Edit form submission
    editForm.onsubmit = async (e) => {
        e.preventDefault();
        await submitEditForm();
    };
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === editModal) {
            editModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
}

// Setup image preview
function setupImagePreview() {
    imageInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        imagePreview.innerHTML = '';
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'preview-image';
                    previewDiv.style.backgroundImage = `url(${e.target.result})`;
                    imagePreview.appendChild(previewDiv);
                };
                reader.readAsDataURL(file);
            }
        });
    };
}

// Setup Socket.io listeners
function setupSocketListeners() {
    socket.on('propertyAdded', (property) => {
        allProperties.unshift(property);
        displayAdminProperties(allProperties);
        showSuccess('İlan başarıyla eklendi!');
    });
    
    socket.on('propertyUpdated', (updatedProperty) => {
        const index = allProperties.findIndex(p => p.id === updatedProperty.id);
        if (index !== -1) {
            allProperties[index] = updatedProperty;
            displayAdminProperties(allProperties);
            showSuccess('İlan başarıyla güncellendi!');
        }
    });
    
    socket.on('propertyDeleted', (propertyId) => {
        allProperties = allProperties.filter(p => p.id !== propertyId);
        displayAdminProperties(allProperties);
        showSuccess('İlan başarıyla silindi!');
    });
}

// Submit new property form
async function submitPropertyForm() {
    try {
        const formData = new FormData(propertyForm);
        formData.append('token', getAuthToken());
        
        const response = await fetch('/api/admin/properties', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
            return;
        }
        
        if (response.ok) {
            const newProperty = await response.json();
            propertyForm.reset();
            imagePreview.innerHTML = '';
            // Success message will come from socket event
        } else {
            const error = await response.json();
            showError(error.error || 'İlan eklenirken hata oluştu');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showError('İlan eklenirken hata oluştu');
    }
}

// Edit property
function editProperty(propertyId) {
    const property = allProperties.find(p => p.id === propertyId);
    if (!property) return;
    
    currentEditProperty = property;
    
    // Fill edit form
    document.getElementById('editPropertyId').value = property.id;
    document.getElementById('editTitle').value = property.title;
    document.getElementById('editDescription').value = property.description;
    document.getElementById('editPrice').value = property.price;
    document.getElementById('editRooms').value = property.rooms;
    document.getElementById('editBathrooms').value = property.bathrooms;
    document.getElementById('editSquareMeters').value = property.squareMeters;
    document.getElementById('editIsActive').checked = property.isActive;
    
    editModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Submit edit form
async function submitEditForm() {
    try {
        const formData = new FormData(editForm);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            price: parseInt(formData.get('price')),
            rooms: parseInt(formData.get('rooms')),
            bathrooms: parseInt(formData.get('bathrooms')),
            squareMeters: parseInt(formData.get('squareMeters')),
            isActive: formData.get('isActive') === 'on'
        };
        
        const response = await fetch(`/api/admin/properties/${currentEditProperty.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
            return;
        }
        
        if (response.ok) {
            editModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Success message will come from socket event
        } else {
            const error = await response.json();
            showError(error.error || 'İlan güncellenirken hata oluştu');
        }
    } catch (error) {
        console.error('Error updating property:', error);
        showError('İlan güncellenirken hata oluştu');
    }
}

// Delete property
async function deleteProperty(propertyId, propertyTitle) {
    if (!confirm(`"${propertyTitle}" ilanını silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/properties/${propertyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
            return;
        }
        
        if (!response.ok) {
            const error = await response.json();
            showError(error.error || 'İlan silinirken hata oluştu');
        }
        // Success message will come from socket event
    } catch (error) {
        console.error('Error deleting property:', error);
        showError('İlan silinirken hata oluştu');
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
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
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

// Add notification animations
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
        color: #f39c12;
    }
    
    .no-properties h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
        color: #2c3e50;
    }
    
    .admin-property-description {
        color: #7f8c8d;
        font-size: 0.9rem;
        line-height: 1.5;
        margin-bottom: 16px;
    }
    
    .logout-btn {
        background: #e74c3c !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: background 0.3s !important;
    }
    
    .logout-btn:hover {
        background: #c0392b !important;
    }
`;
document.head.appendChild(style);
