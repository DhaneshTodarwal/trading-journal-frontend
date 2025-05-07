/**
 * Trade Review System
 * Helps traders analyze their trades to identify strengths, weaknesses, and patterns
 */

class TradeReviewSystem {
    constructor() {
        this.initElements();
        this.setupEventListeners();
        this.loadPreviousReviews();
        this.populateTradeSelection(); // Add this line to populate trade dropdown on initialization
    }

    initElements() {
        // Review form elements
        this.reviewForm = document.getElementById('trade-review-form');
        this.tradeIdInput = document.getElementById('review-trade-id');
        this.tradeDetailsContainer = document.getElementById('review-trade-details');
        this.executionRating = document.getElementById('execution-rating');
        this.planRating = document.getElementById('plan-rating');
        this.riskRating = document.getElementById('risk-rating');
        this.emotionRating = document.getElementById('emotion-rating');
        this.reviewNotes = document.getElementById('review-notes');
        this.improvementInput = document.getElementById('improvement-points');
        this.saveReviewButton = document.getElementById('save-review');
        
        // Review list elements
        this.reviewsList = document.getElementById('reviews-list');
        this.reviewFilter = document.getElementById('review-filter');
        this.reviewSort = document.getElementById('review-sort');
        
        // Review stats elements
        this.avgExecutionElement = document.getElementById('avg-execution');
        this.avgPlanElement = document.getElementById('avg-plan');
        this.avgRiskElement = document.getElementById('avg-risk');
        this.avgEmotionElement = document.getElementById('avg-emotion');
        this.commonImprovementsElement = document.getElementById('common-improvements');
    }

    setupEventListeners() {
        // Handle form submission
        if (this.reviewForm) {
            this.reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveReview();
            });
        }
        
        // Handle review filters
        if (this.reviewFilter) {
            this.reviewFilter.addEventListener('change', () => this.filterReviews());
        }
        
        // Handle review sorting
        if (this.reviewSort) {
            this.reviewSort.addEventListener('change', () => this.sortReviews());
        }
        
        // Set up star rating functionality
        this.setupStarRatings();
        
        // Add improvement tag functionality
        this.setupImprovementTags();
        
        // Add trade selection change listener
        if (this.tradeIdInput) {
            this.tradeIdInput.addEventListener('change', () => {
                const selectedTradeId = this.tradeIdInput.value;
                if (selectedTradeId) {
                    this.loadTradeDetails(selectedTradeId);
                } else {
                    this.tradeDetailsContainer.innerHTML = '';
                }
            });
        }
    }

    setupStarRatings() {
        const ratingContainers = document.querySelectorAll('.star-rating');
        
        ratingContainers.forEach(container => {
            const stars = container.querySelectorAll('.star');
            const hiddenInput = container.querySelector('input[type="hidden"]');
            
            stars.forEach((star, index) => {
                // Hover effect
                star.addEventListener('mouseenter', () => {
                    // Fill in this star and all stars before it
                    for (let i = 0; i <= index; i++) {
                        stars[i].classList.add('hover');
                    }
                });
                
                star.addEventListener('mouseleave', () => {
                    // Remove hover class from all stars
                    stars.forEach(s => s.classList.remove('hover'));
                });
                
                // Click effect - set rating
                star.addEventListener('click', () => {
                    // Set value to hidden input
                    const rating = index + 1;
                    hiddenInput.value = rating;
                    
                    // Update visual state
                    stars.forEach((s, i) => {
                        if (i < rating) {
                            s.classList.add('selected');
                        } else {
                            s.classList.remove('selected');
                        }
                    });
                });
            });
        });
    }

    setupImprovementTags() {
        const tagContainer = document.getElementById('improvement-tags-container');
        const tagInput = document.getElementById('improvement-points');
        const addTagBtn = document.getElementById('add-improvement-tag');
        
        if (!tagContainer || !tagInput || !addTagBtn) return;
        
        // Common improvement tags
        const commonTags = [
            'Better Entry', 'Tighter Stop Loss', 'More Patience', 
            'Size Management', 'Emotional Control', 'Follow Plan',
            'Earlier Exit', 'Later Exit', 'Avoid FOMO'
        ];
        
        // Create common tag buttons
        commonTags.forEach(tag => {
            const tagButton = document.createElement('div');
            tagButton.className = 'improvement-tag';
            tagButton.textContent = tag;
            tagButton.addEventListener('click', () => {
                this.addImprovementTag(tag);
            });
            tagContainer.appendChild(tagButton);
        });
        
        // Add custom tag button functionality
        addTagBtn.addEventListener('click', () => {
            const tagText = tagInput.value.trim();
            if (tagText) {
                this.addImprovementTag(tagText);
                tagInput.value = '';
            }
        });
        
        // Add tag on Enter key
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tagText = tagInput.value.trim();
                if (tagText) {
                    this.addImprovementTag(tagText);
                    tagInput.value = '';
                }
            }
        });
    }

    addImprovementTag(tagText) {
        const selectedTagsContainer = document.getElementById('selected-improvements');
        if (!selectedTagsContainer) return;
        
        // Check if tag already exists
        const existingTags = selectedTagsContainer.querySelectorAll('.selected-tag');
        for (const tag of existingTags) {
            if (tag.dataset.value === tagText) {
                // Highlight existing tag momentarily
                tag.classList.add('highlight');
                setTimeout(() => tag.classList.remove('highlight'), 500);
                return;
            }
        }
        
        // Create new tag
        const tagElement = document.createElement('div');
        tagElement.className = 'selected-tag';
        tagElement.dataset.value = tagText;
        
        tagElement.innerHTML = `
            ${tagText}
            <span class="remove-tag"><i class="fas fa-times"></i></span>
        `;
        
        // Add remove functionality
        tagElement.querySelector('.remove-tag').addEventListener('click', () => {
            tagElement.remove();
            this.updateImprovementPoints();
        });
        
        selectedTagsContainer.appendChild(tagElement);
        this.updateImprovementPoints();
    }

    updateImprovementPoints() {
        const selectedTagsContainer = document.getElementById('selected-improvements');
        const improvementInput = document.getElementById('improvement-points');
        
        if (!selectedTagsContainer || !improvementInput) return;
        
        // Collect all selected tags
        const tags = [];
        selectedTagsContainer.querySelectorAll('.selected-tag').forEach(tag => {
            tags.push(tag.dataset.value);
        });
        
        // Update hidden input value
        improvementInput.value = tags.join(', ');
    }

    loadTradeDetails(tradeId) {
        // Get trades from localStorage
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        const trade = trades.find(t => t.id === tradeId);
        
        if (!trade) {
            this.tradeDetailsContainer.innerHTML = '<p class="error">Trade not found</p>';
            return;
        }
        
        // Format date
        const tradeDate = new Date(trade.date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Determine profit/loss class
        const profitLossClass = parseFloat(trade.profitLossPercentage) >= 0 ? 'profit' : 'loss';
        
        // Create trade details HTML
        this.tradeDetailsContainer.innerHTML = `
            <div class="trade-detail-card ${profitLossClass}">
                <div class="trade-header">
                    <div class="trade-stock">${trade.stock}</div>
                    <div class="trade-type">${trade.tradeType}</div>
                </div>
                <div class="trade-body">
                    <div class="trade-info">
                        <div class="info-item">
                            <span class="info-label">Date:</span>
                            <span class="info-value">${tradeDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Price:</span>
                            <span class="info-value">${trade.strikePrice}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Result:</span>
                            <span class="info-value ${profitLossClass}">${trade.profitLossPercentage}%</span>
                        </div>
                    </div>
                    ${trade.notes ? `
                    <div class="trade-notes">
                        <div class="notes-label">Trade Notes:</div>
                        <div class="notes-content">${trade.notes}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    saveReview() {
        if (!this.tradeIdInput || !this.tradeIdInput.value) {
            console.error('No trade selected for review');
            return;
        }
        
        // Collect review data
        const review = {
            id: 'review_' + Date.now(),
            tradeId: this.tradeIdInput.value,
            date: new Date().toISOString(),
            execution: parseInt(this.executionRating?.value) || 0,
            plan: parseInt(this.planRating?.value) || 0,
            risk: parseInt(this.riskRating?.value) || 0,
            emotion: parseInt(this.emotionRating?.value) || 0,
            notes: this.reviewNotes?.value || '',
            improvements: this.improvementInput?.value || ''
        };
        
        // Validate ratings
        if (review.execution === 0 || review.plan === 0 || review.risk === 0 || review.emotion === 0) {
            alert('Please rate all aspects of your trade');
            return;
        }
        
        // Save review to localStorage
        const reviews = JSON.parse(localStorage.getItem('tradeReviews')) || [];
        
        // Check if already reviewed
        const existingIndex = reviews.findIndex(r => r.tradeId === review.tradeId);
        if (existingIndex !== -1) {
            // Update existing review
            reviews[existingIndex] = review;
        } else {
            // Add new review
            reviews.push(review);
        }
        
        localStorage.setItem('tradeReviews', JSON.stringify(reviews));
        
        // Show success message
        alert('Trade review saved successfully!');
        
        // Reset form
        this.resetReviewForm();
        
        // Reload reviews list
        this.loadPreviousReviews();
        
        // Update statistics
        this.updateReviewStats();
    }

    resetReviewForm() {
        if (!this.reviewForm) return;
        
        // Reset star ratings
        document.querySelectorAll('.star-rating .star').forEach(star => {
            star.classList.remove('selected', 'hover');
        });
        document.querySelectorAll('.star-rating input[type="hidden"]').forEach(input => {
            input.value = '0';
        });
        
        // Reset text inputs
        if (this.reviewNotes) this.reviewNotes.value = '';
        
        // Reset improvement tags
        const selectedTagsContainer = document.getElementById('selected-improvements');
        if (selectedTagsContainer) {
            selectedTagsContainer.innerHTML = '';
        }
        if (this.improvementInput) this.improvementInput.value = '';
        
        // Reset trade selection
        this.tradeIdInput.value = '';
        this.tradeDetailsContainer.innerHTML = '';
    }

    loadPreviousReviews() {
        if (!this.reviewsList) return;
        
        const reviews = JSON.parse(localStorage.getItem('tradeReviews')) || [];
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        
        if (reviews.length === 0) {
            this.reviewsList.innerHTML = '<p class="no-data">No trade reviews found</p>';
            return;
        }
        
        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate HTML for each review
        let html = '';
        reviews.forEach(review => {
            const trade = trades.find(t => t.id === review.tradeId);
            if (!trade) return; // Skip if trade not found
            
            const reviewDate = new Date(review.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const profitLossClass = parseFloat(trade.profitLossPercentage) >= 0 ? 'profit' : 'loss';
            const avgRating = ((review.execution + review.plan + review.risk + review.emotion) / 4).toFixed(1);
            
            html += `
                <div class="review-card" data-trade-id="${review.tradeId}" data-review-id="${review.id}">
                    <div class="review-header">
                        <div class="review-stock">${trade.stock} <span class="trade-type-badge">${trade.tradeType}</span></div>
                        <div class="review-date">${reviewDate}</div>
                    </div>
                    <div class="review-body">
                        <div class="review-result ${profitLossClass}">
                            ${trade.profitLossPercentage}%
                        </div>
                        <div class="review-ratings">
                            <div class="rating-item">
                                <span class="rating-label">Execution:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.execution)}</span>
                            </div>
                            <div class="rating-item">
                                <span class="rating-label">Plan:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.plan)}</span>
                            </div>
                            <div class="rating-item">
                                <span class="rating-label">Risk Mgmt:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.risk)}</span>
                            </div>
                            <div class="rating-item">
                                <span class="rating-label">Emotion:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.emotion)}</span>
                            </div>
                        </div>
                        <div class="review-avg-rating">
                            <span class="avg-label">Overall:</span>
                            <span class="avg-value">${avgRating}/5</span>
                        </div>
                        ${review.improvements ? `
                        <div class="review-improvements">
                            <div class="improvements-label">Areas for Improvement:</div>
                            <div class="improvement-tags">
                                ${review.improvements.split(', ').map(tag => `
                                    <div class="improvement-tag">${tag}</div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        ${review.notes ? `
                        <div class="review-notes">
                            <div class="notes-label">Notes:</div>
                            <div class="notes-content">${review.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="review-actions">
                        <button class="btn-edit-review" data-review-id="${review.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete-review" data-review-id="${review.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        this.reviewsList.innerHTML = html;
        
        // Add event listeners for edit/delete buttons
        document.querySelectorAll('.btn-edit-review').forEach(btn => {
            btn.addEventListener('click', () => this.editReview(btn.dataset.reviewId));
        });
        
        document.querySelectorAll('.btn-delete-review').forEach(btn => {
            btn.addEventListener('click', () => this.deleteReview(btn.dataset.reviewId));
        });
    }

    generateRatingStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    editReview(reviewId) {
        const reviews = JSON.parse(localStorage.getItem('tradeReviews')) || [];
        const review = reviews.find(r => r.id === reviewId);
        
        if (!review) {
            console.error('Review not found');
            return;
        }
        
        // Load trade details
        this.tradeIdInput.value = review.tradeId;
        this.loadTradeDetails(review.tradeId);
        
        // Set ratings
        const ratingsMap = {
            'execution': this.executionRating,
            'plan': this.planRating,
            'risk': this.riskRating,
            'emotion': this.emotionRating
        };
        
        for (const [key, input] of Object.entries(ratingsMap)) {
            if (!input) continue;
            
            input.value = review[key];
            const stars = input.closest('.star-rating').querySelectorAll('.star');
            stars.forEach((star, index) => {
                if (index < review[key]) {
                    star.classList.add('selected');
                } else {
                    star.classList.remove('selected');
                }
            });
        }
        
        // Set notes
        if (this.reviewNotes) {
            this.reviewNotes.value = review.notes || '';
        }
        
        // Set improvement tags
        if (review.improvements) {
            const selectedTagsContainer = document.getElementById('selected-improvements');
            if (selectedTagsContainer) {
                selectedTagsContainer.innerHTML = '';
                const tags = review.improvements.split(', ');
                tags.forEach(tag => this.addImprovementTag(tag));
            }
        }
        
        // Scroll to review form
        this.reviewForm.scrollIntoView({ behavior: 'smooth' });
    }

    deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }
        
        const reviews = JSON.parse(localStorage.getItem('tradeReviews')) || [];
        const updatedReviews = reviews.filter(r => r.id !== reviewId);
        
        localStorage.setItem('tradeReviews', JSON.stringify(updatedReviews));
        
        // Reload reviews
        this.loadPreviousReviews();
        
        // Update statistics
        this.updateReviewStats();
    }

    filterReviews() {
        if (!this.reviewFilter || !this.reviewsList) return;
        
        const filterValue = this.reviewFilter.value;
        const reviews = JSON.parse(localStorage.getItem('tradeReviews')) || [];
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        
        if (reviews.length === 0) {
            this.reviewsList.innerHTML = '<p class="no-data">No trade reviews found</p>';
            return;
        }
        
        let filteredReviews = [...reviews];
        
        // Apply filters
        if (filterValue === 'winners') {
            filteredReviews = reviews.filter(review => {
                const trade = trades.find(t => t.id === review.tradeId);
                return trade && parseFloat(trade.profitLossPercentage) > 0;
            });
        } else if (filterValue === 'losers') {
            filteredReviews = reviews.filter(review => {
                const trade = trades.find(t => t.id === review.tradeId);
                return trade && parseFloat(trade.profitLossPercentage) < 0;
            });
        } else if (filterValue === 'high-rating') {
            filteredReviews = reviews.filter(review => {
                const avgRating = (review.execution + review.plan + review.risk + review.emotion) / 4;
                return avgRating >= 4;
            });
        } else if (filterValue === 'low-rating') {
            filteredReviews = reviews.filter(review => {
                const avgRating = (review.execution + review.plan + review.risk + review.emotion) / 4;
                return avgRating < 3;
            });
        }
        
        // Load filtered reviews
        this.loadFilteredReviews(filteredReviews, trades);
    }

    sortReviews() {
        if (!this.reviewSort || !this.reviewsList) return;
        
        const sortValue = this.reviewSort.value;
        const reviews = JSON.parse(localStorage.getItem('tradeReviews')) || [];
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        
        if (reviews.length === 0) {
            this.reviewsList.innerHTML = '<p class="no-data">No trade reviews found</p>';
            return;
        }
        
        let sortedReviews = [...reviews];
        
        // Apply sorting
        if (sortValue === 'date-new') {
            sortedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortValue === 'date-old') {
            sortedReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortValue === 'rating-high') {
            sortedReviews.sort((a, b) => {
                const avgA = (a.execution + a.plan + a.risk + a.emotion) / 4;
                const avgB = (b.execution + b.plan + b.risk + b.emotion) / 4;
                return avgB - avgA;
            });
        } else if (sortValue === 'rating-low') {
            sortedReviews.sort((a, b) => {
                const avgA = (a.execution + a.plan + a.risk + a.emotion) / 4;
                const avgB = (b.execution + b.plan + b.risk + b.emotion) / 4;
                return avgA - avgB;
            });
        } else if (sortValue === 'profit-high') {
            sortedReviews.sort((a, b) => {
                const tradeA = trades.find(t => t.id === a.tradeId);
                const tradeB = trades.find(t => t.id === b.tradeId);
                const profitA = tradeA ? parseFloat(tradeA.profitLossPercentage) : 0;
                const profitB = tradeB ? parseFloat(tradeB.profitLossPercentage) : 0;
                return profitB - profitA;
            });
        } else if (sortValue === 'profit-low') {
            sortedReviews.sort((a, b) => {
                const tradeA = trades.find(t => t.id === a.tradeId);
                const tradeB = trades.find(t => t.id === b.tradeId);
                const profitA = tradeA ? parseFloat(tradeA.profitLossPercentage) : 0;
                const profitB = tradeB ? parseFloat(tradeB.profitLossPercentage) : 0;
                return profitA - profitB;
            });
        }
        
        // Load sorted reviews
        this.loadFilteredReviews(sortedReviews, trades);
    }

    loadFilteredReviews(filteredReviews, trades) {
        if (!this.reviewsList) return;
        
        if (filteredReviews.length === 0) {
            this.reviewsList.innerHTML = '<p class="no-data">No reviews match your criteria</p>';
            return;
        }
        
        // Generate HTML for filtered reviews
        let html = '';
        filteredReviews.forEach(review => {
            const trade = trades.find(t => t.id === review.tradeId);
            if (!trade) return; // Skip if trade not found
            
            const reviewDate = new Date(review.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const profitLossClass = parseFloat(trade.profitLossPercentage) >= 0 ? 'profit' : 'loss';
            const avgRating = ((review.execution + review.plan + review.risk + review.emotion) / 4).toFixed(1);
            
            html += `
                <div class="review-card" data-trade-id="${review.tradeId}" data-review-id="${review.id}">
                    <div class="review-header">
                        <div class="review-stock">${trade.stock} <span class="trade-type-badge">${trade.tradeType}</span></div>
                        <div class="review-date">${reviewDate}</div>
                    </div>
                    <div class="review-body">
                        <div class="review-result ${profitLossClass}">
                            ${trade.profitLossPercentage}%
                        </div>
                        <div class="review-ratings">
                            <div class="rating-item">
                                <span class="rating-label">Execution:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.execution)}</span>
                            </div>
                            <div class="rating-item">
                                <span class="rating-label">Plan:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.plan)}</span>
                            </div>
                            <div class="rating-item">
                                <span class="rating-label">Risk Mgmt:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.risk)}</span>
                            </div>
                            <div class="rating-item">
                                <span class="rating-label">Emotion:</span>
                                <span class="rating-stars">${this.generateRatingStars(review.emotion)}</span>
                            </div>
                        </div>
                        <div class="review-avg-rating">
                            <span class="avg-label">Overall:</span>
                            <span class="avg-value">${avgRating}/5</span>
                        </div>
                        ${review.improvements ? `
                        <div class="review-improvements">
                            <div class="improvements-label">Areas for Improvement:</div>
                            <div class="improvement-tags">
                                ${review.improvements.split(', ').map(tag => `
                                    <div class="improvement-tag">${tag}</div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        ${review.notes ? `
                        <div class="review-notes">
                            <div class="notes-label">Notes:</div>
                            <div class="notes-content">${review.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="review-actions">
                        <button class="btn-edit-review" data-review-id="${review.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete-review" data-review-id="${review.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        this.reviewsList.innerHTML = html;
        
        // Add event listeners for edit/delete buttons
        document.querySelectorAll('.btn-edit-review').forEach(btn => {
            btn.addEventListener('click', () => this.editReview(btn.dataset.reviewId));
        });
        
        document.querySelectorAll('.btn-delete-review').forEach(btn => {
            btn.addEventListener('click', () => this.deleteReview(btn.dataset.reviewId));
        });
    }

    updateReviewStats() {
        const reviews = JSON.parse(localStorage.getItem('tradeReviews')) || [];
        
        if (reviews.length === 0) {
            if (this.avgExecutionElement) this.avgExecutionElement.textContent = 'N/A';
            if (this.avgPlanElement) this.avgPlanElement.textContent = 'N/A';
            if (this.avgRiskElement) this.avgRiskElement.textContent = 'N/A';
            if (this.avgEmotionElement) this.avgEmotionElement.textContent = 'N/A';
            if (this.commonImprovementsElement) this.commonImprovementsElement.innerHTML = '<p class="no-data">No review data available</p>';
            return;
        }
        
        // Calculate average ratings
        const avgExecution = reviews.reduce((sum, review) => sum + review.execution, 0) / reviews.length;
        const avgPlan = reviews.reduce((sum, review) => sum + review.plan, 0) / reviews.length;
        const avgRisk = reviews.reduce((sum, review) => sum + review.risk, 0) / reviews.length;
        const avgEmotion = reviews.reduce((sum, review) => sum + review.emotion, 0) / reviews.length;
        
        // Update average rating elements
        if (this.avgExecutionElement) this.avgExecutionElement.textContent = avgExecution.toFixed(1);
        if (this.avgPlanElement) this.avgPlanElement.textContent = avgPlan.toFixed(1);
        if (this.avgRiskElement) this.avgRiskElement.textContent = avgRisk.toFixed(1);
        if (this.avgEmotionElement) this.avgEmotionElement.textContent = avgEmotion.toFixed(1);
        
        // Find common improvement points
        if (this.commonImprovementsElement) {
            const improvementCounts = {};
            
            reviews.forEach(review => {
                if (!review.improvements) return;
                
                const improvements = review.improvements.split(', ');
                improvements.forEach(improvement => {
                    improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
                });
            });
            
            // Sort improvements by frequency
            const sortedImprovements = Object.entries(improvementCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5); // Top 5 improvements
            
            if (sortedImprovements.length > 0) {
                let html = '<div class="improvement-stats">';
                sortedImprovements.forEach(([improvement, count]) => {
                    const percentage = Math.round((count / reviews.length) * 100);
                    html += `
                        <div class="improvement-stat">
                            <div class="improvement-name">${improvement}</div>
                            <div class="improvement-bar-container">
                                <div class="improvement-bar" style="width: ${percentage}%"></div>
                                <div class="improvement-percentage">${percentage}%</div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                this.commonImprovementsElement.innerHTML = html;
            } else {
                this.commonImprovementsElement.innerHTML = '<p class="no-data">No improvement data available</p>';
            }
        }
    }
    
    // New method to populate the trade selection dropdown
    populateTradeSelection() {
        if (!this.tradeIdInput) return;
        
        // Get trades from localStorage
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        
        // Sort trades by date (newest first)
        trades.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Create options HTML
        let optionsHTML = '<option value="">-- Select a trade --</option>';
        
        trades.forEach(trade => {
            const tradeDate = new Date(trade.date).toLocaleDateString('en-IN', {
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });
            
            const profitLossIndicator = parseFloat(trade.profitLossPercentage) >= 0 ? '📈' : '📉';
            const profitLoss = parseFloat(trade.profitLossPercentage).toFixed(2);
            
            optionsHTML += `<option value="${trade.id}">${tradeDate} - ${trade.stock} (${trade.tradeType}) ${profitLossIndicator} ${profitLoss}%</option>`;
        });
        
        // Set the options HTML
        this.tradeIdInput.innerHTML = optionsHTML;
    }
}

// Initialize Trade Review System when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tradeReviewSystem = new TradeReviewSystem();
});