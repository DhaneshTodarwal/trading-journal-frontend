/**
 * Trading Journal Tag System
 * This script manages trade tags for categorizing and filtering trades
 */

// Default tag colors
const TAG_COLORS = {
  orange: 'var(--primary-color)',  // Default primary color
  green: '#4CAF50',
  blue: '#2196F3',
  purple: '#9C27B0',
  yellow: '#FFC107'
};

// Main tag management class
class TagManager {
  constructor() {
    this.tags = this.loadTags();
    this.selectedTags = [];
    this.initEventListeners();
    this.renderTags();
  }

  // Load saved tags from local storage
  loadTags() {
    const savedTags = localStorage.getItem('tradingJournalTags');
    
    if (savedTags) {
      return JSON.parse(savedTags);
    } else {
      // Default tags if none exist
      const defaultTags = [
        { id: 'trend-following', name: 'Trend Following', color: 'blue' },
        { id: 'breakout', name: 'Breakout', color: 'green' },
        { id: 'reversal', name: 'Reversal', color: 'purple' },
        { id: 'news-based', name: 'News Based', color: 'yellow' },
        { id: 'gap-fill', name: 'Gap Fill', color: 'orange' }
      ];
      
      localStorage.setItem('tradingJournalTags', JSON.stringify(defaultTags));
      return defaultTags;
    }
  }

  // Save tags to local storage
  saveTags() {
    localStorage.setItem('tradingJournalTags', JSON.stringify(this.tags));
  }

  // Create a new tag
  createTag(name, color = 'orange') {
    if (!name.trim()) return null;
    
    // Create a unique ID from the name
    const id = 'tag-' + name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
    
    const newTag = {
      id,
      name: name.trim(),
      color
    };
    
    this.tags.push(newTag);
    this.saveTags();
    
    return newTag;
  }

  // Delete a tag by ID
  deleteTag(tagId) {
    this.tags = this.tags.filter(tag => tag.id !== tagId);
    this.saveTags();
    
    // Remove from selected tags if present
    this.selectedTags = this.selectedTags.filter(id => id !== tagId);
    
    // Update any UI that uses tags
    this.renderTags();
  }

  // Update a tag
  updateTag(tagId, updates) {
    const tagIndex = this.tags.findIndex(tag => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags[tagIndex] = { 
        ...this.tags[tagIndex], 
        ...updates 
      };
      this.saveTags();
    }
  }

  // Toggle tag selection (for filtering)
  toggleTagSelection(tagId) {
    const index = this.selectedTags.indexOf(tagId);
    
    if (index === -1) {
      this.selectedTags.push(tagId);
    } else {
      this.selectedTags.splice(index, 1);
    }
    
    // Trigger filter update
    this.applyTagFilter();
    
    return this.selectedTags;
  }

  // Initialize event listeners
  initEventListeners() {
    // Add new tag button
    const addTagBtn = document.getElementById('add-tag-btn');
    const newTagInput = document.getElementById('new-tag-input');
    
    if (addTagBtn && newTagInput) {
      addTagBtn.addEventListener('click', () => {
        const tagName = newTagInput.value.trim();
        if (tagName) {
          const newTag = this.createTag(tagName);
          if (newTag) {
            newTagInput.value = '';
            this.renderTags();
          }
        }
      });
      
      // Allow Enter key to add tag
      newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTagBtn.click();
        }
      });
    }
    
    // Filter tag clicks in the trade history section
    const filterTagsContainer = document.getElementById('filter-tags-container');
    if (filterTagsContainer) {
      filterTagsContainer.addEventListener('click', (e) => {
        const tagPill = e.target.closest('.tag-pill');
        if (tagPill) {
          const tagId = tagPill.dataset.tagId;
          tagPill.classList.toggle('active');
          this.toggleTagSelection(tagId);
        }
      });
    }
    
    // Trade tags in the form
    const tradeTagsContainer = document.getElementById('trade-tags-container');
    if (tradeTagsContainer) {
      tradeTagsContainer.addEventListener('click', (e) => {
        const tagPill = e.target.closest('.tag-pill');
        if (tagPill) {
          tagPill.classList.toggle('active');
          // The active class will be used when saving the trade
        }
      });
    }
  }

  // Render tags in containers
  renderTags() {
    // Render tags in the trade form
    const tradeTagsContainer = document.getElementById('trade-tags-container');
    if (tradeTagsContainer) {
      tradeTagsContainer.innerHTML = this.tags.map(tag => {
        return `<div class="tag-pill ${tag.color}" data-tag-id="${tag.id}">${tag.name}</div>`;
      }).join('');
    }
    
    // Render tags in the filter section
    const filterTagsContainer = document.getElementById('filter-tags-container');
    if (filterTagsContainer) {
      filterTagsContainer.innerHTML = this.tags.map(tag => {
        const isActive = this.selectedTags.includes(tag.id) ? 'active' : '';
        return `<div class="tag-pill ${tag.color} ${isActive}" data-tag-id="${tag.id}">${tag.name}</div>`;
      }).join('');
    }
  }

  // Apply tag filter to trades list
  applyTagFilter() {
    // Skip if no tags are selected
    if (this.selectedTags.length === 0) {
      this.showAllTrades();
      return;
    }
    
    const tradesList = document.getElementById('trades-list');
    if (!tradesList) return;
    
    // Get all trade cards
    const tradeCards = tradesList.querySelectorAll('.trade-card');
    
    tradeCards.forEach(card => {
      // Get tags for this trade
      const tradeTags = card.dataset.tags ? JSON.parse(card.dataset.tags) : [];
      
      // Check if any selected tag is in this trade's tags
      const hasSelectedTag = this.selectedTags.some(tagId => tradeTags.includes(tagId));
      
      // Show/hide based on tag selection
      if (hasSelectedTag) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Show all trades (clear tag filter)
  showAllTrades() {
    const tradesList = document.getElementById('trades-list');
    if (!tradesList) return;
    
    const tradeCards = tradesList.querySelectorAll('.trade-card');
    tradeCards.forEach(card => {
      card.style.display = '';
    });
  }

  // Get selected tags for the trade form (when saving)
  getSelectedTradeFormTags() {
    const tradeTagsContainer = document.getElementById('trade-tags-container');
    if (!tradeTagsContainer) return [];
    
    const selectedTagPills = tradeTagsContainer.querySelectorAll('.tag-pill.active');
    return Array.from(selectedTagPills).map(pill => pill.dataset.tagId);
  }

  // Get tag data by ID
  getTagById(tagId) {
    return this.tags.find(tag => tag.id === tagId);
  }

  // Render tags for a specific trade in trade details
  renderTradeTagsHTML(tagIds) {
    if (!tagIds || !tagIds.length) return '';
    
    return tagIds.map(tagId => {
      const tag = this.getTagById(tagId);
      if (!tag) return '';
      
      return `<span class="trade-tag ${tag.color}">${tag.name}</span>`;
    }).join('');
  }
}

// Initialize tag manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.tagManager = new TagManager();
  
  // Hook into trade form submission if it exists
  const tradeForm = document.getElementById('trade-form');
  if (tradeForm) {
    tradeForm.addEventListener('submit', function(e) {
      // Store tags in the form data
      const tradeFormData = new FormData(tradeForm);
      const selectedTags = window.tagManager.getSelectedTradeFormTags();
      
      // This will be handled by your existing trade saving logic
      // We're just adding it to the form submission process
      if (window.saveTrade) {
        const tradeObject = Object.fromEntries(tradeFormData.entries());
        tradeObject.tags = selectedTags;
      }
    });
  }
  
  // Hook into the display trades function if it exists
  if (window.displayTrades) {
    const originalDisplayTrades = window.displayTrades;
    window.displayTrades = function(trades) {
      // Call original function first
      originalDisplayTrades(trades);
      
      // Now enhance the trade cards with tags
      const tradesList = document.getElementById('trades-list');
      if (!tradesList) return;
      
      const tradeCards = tradesList.querySelectorAll('.trade-card');
      
      tradeCards.forEach((card, index) => {
        if (index < trades.length) {
          const trade = trades[index];
          
          // Add tag information to the card's dataset for filtering
          if (trade.tags) {
            card.dataset.tags = JSON.stringify(trade.tags);
            
            // Add visual representation of tags
            const tagsHTML = window.tagManager.renderTradeTagsHTML(trade.tags);
            if (tagsHTML) {
              // Find a suitable place to add tags in your card structure
              // This is a generic approach; adjust based on your specific card layout
              const detailsSection = card.querySelector('.trade-details') || card.querySelector('.trade-info');
              if (detailsSection) {
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'trade-tags';
                tagsContainer.innerHTML = tagsHTML;
                detailsSection.appendChild(tagsContainer);
              }
            }
          }
        }
      });
      
      // Apply any active tag filters
      window.tagManager.applyTagFilter();
    };
  }
  
  // Hook into filter/search functions if they exist
  if (window.filterTrades) {
    const originalFilterTrades = window.filterTrades;
    window.filterTrades = function() {
      // Call original filter function
      originalFilterTrades();
      
      // Then apply tag filters
      window.tagManager.applyTagFilter();
    };
  }
});