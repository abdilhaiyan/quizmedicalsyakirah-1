/**
 * Dynamic Quiz Application Engine
 * Encapsulated to guarantee state machine protection.
 */
class QuizEngine {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.isAnswered = false;

        // Dom Element Bindings
        this.dom = {
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            errorMessage: document.getElementById('error-message'),
            quizView: document.getElementById('quiz-view'),
            resultsView: document.getElementById('results-view'),
            questionText: document.getElementById('question-text'),
            imageContainer: document.getElementById('question-image-container'), // RESTORED: Main question image target slot
            optionsContainer: document.getElementById('options-container'),
            feedbackContainer: document.getElementById('feedback-container'),
            feedbackTitle: document.getElementById('feedback-title'),
            explanationText: document.getElementById('explanation-text'),
            nextButton: document.getElementById('next-btn'),
            progressText: document.getElementById('progress-text'),
            progressBarFill: document.getElementById('progress-bar-fill'),
            liveScore: document.getElementById('live-score'),
            finalScore: document.getElementById('final-score'),
            performanceSummary: document.getElementById('performance-summary')
        };

        this.init();
    }

    async init() {
        this.dom.nextButton.addEventListener('click', () => this.advanceQuiz());
        
        try {
            // Fetch configuration array from system source
            const response = await fetch('questions.json');
            if (!response.ok) throw new Error(`HTTP network error: Status ${response.status}`);
            
            const rawData = await response.json();
            this.questions = this.validateData(rawData);
            
            // Swap view states safely
            this.dom.loadingState.classList.add('hidden');
            this.dom.quizView.classList.remove('hidden');
            this.renderQuestion();
        } catch (error) {
            console.error("Quiz Init Engine Failure:", error);
            this.dom.loadingState.classList.add('hidden');
            this.dom.errorMessage.textContent = `Configuration Fetch Failure: ${error.message}. If running locally, please use a local web server environment.`;
            this.dom.errorState.classList.remove('hidden');
        }
    }

    validateData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("The questions schema file is empty or malformed.");
        }
        // FIXED: Removed .slice(0, 20) so it loads all questions in your JSON file dynamically
        return data; 
    }

    renderQuestion() {
        this.isAnswered = false;
        this.dom.feedbackContainer.classList.add('hidden');
        this.dom.optionsContainer.innerHTML = '';
        this.dom.imageContainer.innerHTML = ''; // Clear out the prior question's main diagram image

        const currentQ = this.questions[this.currentIndex];

        // UI HTML/Text assignments
        this.dom.questionText.innerHTML = currentQ.question;
        this.dom.progressText.textContent = `Question ${this.currentIndex + 1} of ${this.questions.length}`;
        this.dom.progressBarFill.style.width = `${((this.currentIndex) / this.questions.length) * 100}%`;
        this.dom.liveScore.textContent = this.score;

        // FIXED FEATURE 1: Render the main question diagram if it exists in the JSON schema
        if (currentQ.image && currentQ.image.trim() !== "") {
            const quizImage = document.createElement('img');
            quizImage.src = currentQ.image;
            quizImage.alt = `Diagram source reference for question ${currentQ.id}`;
            quizImage.classList.add('quiz-question-img');
            this.dom.imageContainer.appendChild(quizImage);
        }

        // FIXED FEATURE 2: Build dynamic response buttons (supporting both image objects and text strings)
        currentQ.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.setAttribute('data-index', index);
            button.addEventListener('click', (e) => this.evaluateAnswer(e));

            if (typeof option === 'object' && option !== null && option.image) {
                const img = document.createElement('img');
                img.src = option.image;
                img.alt = `Option ${String.fromCharCode(65 + index)}`;
                img.classList.add('quiz-option-img');
                button.appendChild(img);
            } else {
                button.innerHTML = option;
            }

            this.dom.optionsContainer.appendChild(button);
        });
    }

    evaluateAnswer(event) {
        if (this.isAnswered) return; 
        this.isAnswered = true;

        const selectedButton = event.currentTarget;
        const selectedIndex = parseInt(selectedButton.getAttribute('data-index'), 10);
        const currentQ = this.questions[this.currentIndex];
        
        const allOptionButtons = this.dom.optionsContainer.querySelectorAll('.option-btn');
        allOptionButtons.forEach(btn => btn.setAttribute('disabled', 'true'));

        if (selectedIndex === currentQ.correctAnswer) {
            selectedButton.classList.add('correct-choice');
            this.score++;
            this.dom.liveScore.textContent = this.score;
            this.dom.feedbackTitle.textContent = "✓ Correct";
            this.dom.feedbackTitle.style.color = "var(--color-correct)";
        } else {
            selectedButton.classList.add('incorrect-choice');
            const correctBtn = this.dom.optionsContainer.querySelector(`[data-index="${currentQ.correctAnswer}"]`);
            if (correctBtn) correctBtn.classList.add('correct-choice');
            
            this.dom.feedbackTitle.textContent = "✕ Incorrect";
            this.dom.feedbackTitle.style.color = "var(--color-incorrect)";
        }

        this.dom.explanationText.innerHTML = currentQ.explanation; 
        this.dom.feedbackContainer.classList.remove('hidden');
    }

    advanceQuiz() {
        this.currentIndex++;
        if (this.currentIndex < this.questions.length) {
            this.renderQuestion();
        } else {
            this.displayFinalResults();
        }
    }

   displayFinalResults() {
        this.dom.quizView.classList.add('hidden');
        this.dom.resultsView.classList.remove('hidden');
        
        this.dom.progressBarFill.style.width = '100%';
        this.dom.finalScore.textContent = this.score;
        
        // FIXED: Dynamically inject the final total count to the results board
        const totalSlot = document.getElementById('total-possible-score');
        if (totalSlot) totalSlot.textContent = this.questions.length;

        const percentage = (this.score / this.questions.length) * 100;
        if (percentage >= 80) {
            this.dom.performanceSummary.textContent = "Exceptional result! Outstanding execution and accuracy.";
        } else if (percentage >= 50) {
            this.dom.performanceSummary.textContent = "Solid pass performance. A light revision is recommended.";
        } else {
            this.dom.performanceSummary.textContent = "Try again. Do revision first before restart.";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuizEngine();
});
