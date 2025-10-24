/**
 * Notification Templates
 * Pre-written fantasy-themed notification messages for fallback system
 */

/**
 * Template categories and messages
 */
export const notificationTemplates = {
  // Idle notifications (user inactive for 2+ minutes)
  idle: [
    {
      title: "The Realm Awaits",
      message: "The magical energies grow restless in your absence, brave adventurer.",
      icon: "🌙"
    },
    {
      title: "Ancient Wisdom",
      message: "Even the mightiest wizards need moments of contemplation and rest.",
      icon: "🧙"
    },
    {
      title: "Mystical Whispers",
      message: "The spirits of the realm wonder if you're still listening...",
      icon: "👻"
    },
    {
      title: "Quest Reminder",
      message: "Your quests remain unfinished. Will you return to complete them?",
      icon: "📜"
    },
    {
      title: "Tavern Tales",
      message: "The bards in the tavern are spinning tales of your adventures!",
      icon: "🍺"
    }
  ],

  // File save notifications
  fileSave: [
    {
      title: "Scroll Preserved",
      message: "Your knowledge has been inscribed upon the eternal scrolls.",
      icon: "📜"
    },
    {
      title: "Ancient Archives",
      message: "The archivists of the realm have safely stored your creation.",
      icon: "📚"
    },
    {
      title: "Magical Backup",
      message: "Your work is now protected by enchantments most powerful!",
      icon: "✨"
    },
    {
      title: "Treasure Secured",
      message: "Another precious artifact added to your collection!",
      icon: "💎"
    },
    {
      title: "Chronicle Updated",
      message: "The great chronicles of the realm have been updated with your work.",
      icon: "📖"
    }
  ],

  // File delete notifications
  fileDelete: [
    {
      title: "Into the Void",
      message: "The artifact has been returned to the ethereal plane.",
      icon: "🌀"
    },
    {
      title: "Cleansing Ritual",
      message: "The old makes way for the new. Your storage grows lighter!",
      icon: "🔥"
    },
    {
      title: "Banishment Complete",
      message: "The unwanted scroll has been banished from the realm.",
      icon: "⚡"
    },
    {
      title: "Space Reclaimed",
      message: "More room in your treasure chest for future discoveries!",
      icon: "💼"
    }
  ],

  // Window open notifications
  windowOpen: [
    {
      title: "Portal Opened",
      message: "A new window to possibility has been unveiled!",
      icon: "🚪"
    },
    {
      title: "Realm Expansion",
      message: "Your workspace grows ever more magnificent!",
      icon: "🏰"
    },
    {
      title: "New Chapter",
      message: "Another page in your adventure begins...",
      icon: "📄"
    },
    {
      title: "Multitasking Maven",
      message: "Truly, you are mastering the art of parallel quests!",
      icon: "🎯"
    }
  ],

  // Window close notifications
  windowClose: [
    {
      title: "Portal Sealed",
      message: "The energies return to balance as the window closes.",
      icon: "🔒"
    },
    {
      title: "Quest Complete",
      message: "Another task finished. Well done, adventurer!",
      icon: "✅"
    },
    {
      title: "Focus Sharpened",
      message: "With fewer distractions, your power grows stronger.",
      icon: "🎯"
    },
    {
      title: "Tidy Realm",
      message: "A clean workspace is a sign of a clear mind!",
      icon: "✨"
    }
  ],

  // Calculator use notifications
  calculatorUse: [
    {
      title: "Mana Calculations",
      message: "The mystical orb reveals numerical truths!",
      icon: "🔮"
    },
    {
      title: "Arcane Mathematics",
      message: "Even wizards need to count their spell components!",
      icon: "🧮"
    },
    {
      title: "Numbers Game",
      message: "The ancient art of calculation serves you well.",
      icon: "🎲"
    },
    {
      title: "Precise Sorcery",
      message: "Precision in calculation leads to power in magic!",
      icon: "⚡"
    }
  ],

  // Generic encouragement
  encouragement: [
    {
      title: "Legendary Progress",
      message: "Your dedication to your craft is truly inspiring!",
      icon: "🌟"
    },
    {
      title: "Master Craftsman",
      message: "Each action brings you closer to mastery!",
      icon: "⚒️"
    },
    {
      title: "Rising Star",
      message: "The realm takes notice of your growing prowess!",
      icon: "⭐"
    },
    {
      title: "Unstoppable Force",
      message: "Nothing can halt an adventurer as determined as you!",
      icon: "💪"
    },
    {
      title: "Wisdom Grows",
      message: "With each passing moment, your knowledge deepens.",
      icon: "🧠"
    }
  ],

  // Tips and hints
  tips: [
    {
      title: "Pro Tip",
      message: "Try using keyboard shortcuts to navigate faster through the realm!",
      icon: "⌨️"
    },
    {
      title: "Hidden Knowledge",
      message: "Drag windows by their title bars to rearrange your workspace.",
      icon: "🎓"
    },
    {
      title: "Sage Advice",
      message: "The minimize button sends windows to the tavern sidebar for safekeeping.",
      icon: "💡"
    },
    {
      title: "Ancient Secret",
      message: "Press Escape to quickly close the active window!",
      icon: "🗝️"
    },
    {
      title: "Mystic Insight",
      message: "Your files are automatically saved to IndexedDB for persistence.",
      icon: "💾"
    }
  ],

  // Welcome messages
  welcome: [
    {
      title: "Welcome Back!",
      message: "The realm rejoices at your return, noble adventurer!",
      icon: "🎉"
    },
    {
      title: "Greetings Traveler",
      message: "May your session be productive and your code bug-free!",
      icon: "👋"
    },
    {
      title: "The Quest Continues",
      message: "Ready to continue your epic journey?",
      icon: "🗡️"
    }
  ]
};

/**
 * Get random template from category
 * @param {string} category - Template category
 * @returns {Object} Random notification template
 */
export function getRandomTemplate(category) {
  const templates = notificationTemplates[category];
  
  if (!templates || templates.length === 0) {
    return {
      title: "Quest Update",
      message: "Something interesting is happening in the realm...",
      icon: "✨"
    };
  }
  
  const randomIndex = Math.floor(Math.random() * templates.length);
  return { ...templates[randomIndex] };
}

/**
 * Get all templates for a category
 * @param {string} category - Template category
 * @returns {Array} Array of templates
 */
export function getTemplatesByCategory(category) {
  return notificationTemplates[category] || [];
}

/**
 * Get random template from any category
 * @returns {Object} Random notification template
 */
export function getRandomTemplateAny() {
  const categories = Object.keys(notificationTemplates);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  return getRandomTemplate(randomCategory);
}
