import React from "react";

import "./CharacterEditView.css";
import CharacterList from "../../components/CharacterList/CharacterList";
import CharacterAvatar from "../../components/CharacterAvatar/CharacterAvatar";
import OptimizationPlan from "../../domain/OptimizationPlan";
import Modal from "../../components/Modal/Modal";
import RangeInput from "../../components/RangeInput/RangeInput";
import Toggle from "../../components/Toggle/Toggle";

class CharacterEditView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'availableCharacters': props.availableCharacters,
      'selectedCharacters': props.selectedCharacters,
      'editCharacter': null,
      'selectedTarget': null,
      'instructions': false,
      'filterString': ''
    };

    this.saveState = 'function' === typeof props.saveState ? props.saveState : function() {
    };
  }

  dragStart(character) {
    return function(event) {
      event.dataTransfer.dropEffect = 'move';
      event.dataTransfer.setData('text/plain', character.name);
    }
  }

  static dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  static dragLeave(event) {
    event.preventDefault();
    event.target.classList.remove('drop-character');
  }

  static availableCharactersDragEnter(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  availableCharactersDrop(event) {
    event.preventDefault();
    const movingCharacterName = event.dataTransfer.getData('text/plain');
    let availableCharacters = this.state.availableCharacters;
    let selectedCharacters = this.state.selectedCharacters;
    const sourceCharacterIndex = selectedCharacters.findIndex(c => c.name === movingCharacterName)
    if (-1 === sourceCharacterIndex) {
      return;
    }

    if (!this.state.availableCharacters.some(c => c.name === movingCharacterName)) {
      availableCharacters.push(selectedCharacters[sourceCharacterIndex]);
    }
    selectedCharacters.splice(sourceCharacterIndex, 1);

    this.saveState();

    this.setState({
      availableCharacters: availableCharacters,
      selectedCharacters: selectedCharacters
    });
  }

  characterDrop() {
    const me = this;
    return function(targetList, dragTarget, dropTarget) {
      let sourceList;

      if (me.state.selectedCharacters.some(character => dragTarget === character.name)) {
        sourceList = me.state.selectedCharacters;
      } else if (me.state.availableCharacters.some(character => dragTarget === character.name)) {
        sourceList = me.state.availableCharacters;
      }

      // Get the character from the source list
      let [sourceCharacter] = sourceList.splice(sourceList.findIndex((character) => character.name === dragTarget), 1);
      // Put it into the target list
      targetList.splice(targetList.findIndex((character) => character.name === dropTarget) + 1, 0, sourceCharacter);

      me.saveState();

      // Re-render
      me.setState({});
    }
  }

  /**
   * Move a character from availableCharacters to the bottom of the selectedCharacters
   * @param character
   */
  selectCharacter(character) {
    const availableCharacters = this.state.availableCharacters;
    const selectedCharacters = this.state.selectedCharacters;

    if (availableCharacters.includes(character)) {
      availableCharacters.splice(availableCharacters.indexOf(character), 1)
      selectedCharacters.push(character);

      this.setState({
        availableCharacters: availableCharacters,
        selectedCharacters: selectedCharacters
      });
    }
  }

  saveOptimizationPlan(character, form) {
    const planName = form['plan-name'].value;
    let optimizationPlan;

    if (form.mode.checked) {
      // Advanced form
      optimizationPlan = new OptimizationPlan(
        form['health-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.health,
        form['protection-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.protection,
        form['speed-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.speed,
        form['critDmg-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.critDmg,
        form['potency-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.potency,
        form['tenacity-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.tenacity,
        form['offense-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.offense,
        form['critChance-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.critChance,
        form['defense-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.defense,
        form['accuracy-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.accuracy,
        form['critAvoid-stat-advanced'].valueAsNumber * OptimizationPlan.statWeight.critAvoid,
      );
    } else {
      // Basic form
      optimizationPlan = new OptimizationPlan(
        form['health-stat'].valueAsNumber,
        form['protection-stat'].valueAsNumber,
        form['speed-stat'].valueAsNumber,
        form['critDmg-stat'].valueAsNumber,
        form['potency-stat'].valueAsNumber,
        form['tenacity-stat'].valueAsNumber,
        form['offense-stat'].valueAsNumber,
        form['critChance-stat'].valueAsNumber,
        form['defense-stat'].valueAsNumber,
        form['accuracy-stat'].valueAsNumber,
        form['critAvoid-stat'].valueAsNumber,
      );
    }

    if ('custom' !== planName && 'lock' !== planName) {
      character.namedPlans[planName] = optimizationPlan;
      character.optimizationPlan = character.namedPlans[planName];
    } else {
      character.optimizationPlan = optimizationPlan;
    }
    character.useOnly5DotMods = form['5dot'].checked;

    this.saveState();

    this.setState({
      'editCharacter': null
    });
  }

  cancelEdit() {
    this.setState({
      'editCharacter': null
    });
  }

  render() {
    const availableCharacters = this.state.availableCharacters.sort((left, right) => {
      return right.galacticPower - left.galacticPower;
    });
    const selectedCharacters = this.state.selectedCharacters;
    const editCharacter = this.state.editCharacter;

    const characterFilter = character =>
      '' === this.state.filterString || character.matchesFilter(this.state.filterString);

    const filteredCharacters = availableCharacters.filter(characterFilter);
    const unfilteredCharacters = availableCharacters.filter((c) => !characterFilter(c));

    return <div className={'character-edit'}>
      <div className={'sidebar'}>
        {this.filterForm()}
        {this.sidebarActions()}
      </div>
      <div className={'selected-characters'}>
        <h4>Selected Characters</h4>
        <CharacterList
          selfDrop={true}
          draggable={true}
          characters={selectedCharacters}
          onDrop={this.characterDrop()}
          onEdit={(character, planName) => this.setState({
            editCharacter: character,
            selectedTarget: planName
          })}
          saveState={this.saveState}
        />
      </div>
      <div className={'available-characters'}
           onDragEnter={CharacterEditView.availableCharactersDragEnter}
           onDragOver={CharacterEditView.dragOver}
           onDragLeave={CharacterEditView.dragLeave}
           onDrop={this.availableCharactersDrop.bind(this)}
      >
        <h3 className={'instructions'}>
          Double-click or drag characters to the selected column to pick who to optimize mods for.
          <button type={'button'} className={'small'} onClick={() => this.setState({'instructions': true})}>
            Show full instructions
          </button>
        </h3>
        {filteredCharacters.map(character => this.characterBlock(character, 'active'))}
        {unfilteredCharacters.map(character => this.characterBlock(character, 'inactive'))}
      </div>
      <Modal show={editCharacter} content={this.characterEditModal(editCharacter)}/>
      <Modal show={this.state.instructions} className={'instructions'} content={this.instructionsModal()}/>
    </div>;
  }

  /**
   * Renders a form for filtering available characters
   *
   * @returns JSX Element
   */
  filterForm() {
    return <div className={'filters'}>
      <div className={'filter-form'}>
        <label htmlFor={'character-filter'}>Search by character name, tag, or common abbreviation:</label>
        <input autoFocus={true} id='character-filter' type='text'
               onChange={(e) => this.setState({filterString: e.target.value.toLowerCase()})}
        />
      </div>
    </div>;
  }

  /**
   * Renders a sidebar box with action buttons
   *
   * @returns JSX Element
   */
  sidebarActions() {
    return <div className={'sidebar-actions'}>
      <h3>Actions</h3>
      <button
        type={'button'}
        onClick={this.props.onOptimize}
        disabled={this.state.selectedCharacters.length === 0}
      >
        Optimize my mods!
      </button>
    </div>
  }

  /**
   * Render a character block for the set of available characters. This includes the character portrait and a button
   * to edit the character's stats
   * @param character Character
   * @param className String A class to apply to each character block
   */
  characterBlock(character, className) {
    return <div
      className={className ? 'character ' + className : 'character'}
      key={character.name}
    >
      <div draggable={true} onDragStart={this.dragStart(character)}
           onDoubleClick={() => this.selectCharacter(character)}>
        <CharacterAvatar character={character}/>
      </div>
      <div className={'character-name'}>{character.name}</div>
    </div>;
  }

  /**
   * Render a modal for editing a character's base stats and optimization plan
   * @param character Character
   * @returns JSX Element
   */
  characterEditModal(character) {
    if (!character) {
      return null;
    }

    let planType;

    if (character.optimizationPlan.isBasic()) {
      planType = 'basic';
    } else {
      planType = 'advanced';
    }

    return <form
      className={`character-edit-form ${planType}`}
      onSubmit={(e) => {
        e.preventDefault();
        this.saveOptimizationPlan.bind(this, character)(e.target);
      }}>
      <div className={'character-view'}>
        <CharacterAvatar character={character}/>
        <h2 className={'character-name'}>{character.name}</h2>
      </div>
      <div id={'character-level-options'}>
        <div className={'form-row'}>
          <label htmlFor="5dot" id={'fivedot-label'}>Use only 5-dot mods?</label>
          <input
            type={'checkbox'}
            id={'5dot'}
            name={'5dot'}
            defaultChecked={character.useOnly5DotMods}/>
        </div>
      </div>
      <div className={'instructions'}>
        Give each stat type a value. This will be used to calculate the optimum mods to equip. You can give this plan
        a name to easily select it later.
      </div>
      <div className={'header-row'}>
        <label htmlFor={'plan-name'}>Plan Name: </label>
        <input type={'text'} defaultValue={this.state.selectedTarget} id={'plan-name'} name={'plan-name'}/>
      </div>
      <div className={'header-row'}>
        <Toggle
          inputLabel={'Mode'}
          name={'mode'}
          leftLabel={'Basic'}
          leftValue={'basic'}
          rightLabel={'Advanced'}
          rightValue={'advanced'}
          value={planType}
          onChange={(newValue) => {
            const form = document.getElementsByClassName('character-edit-form')[0];
            form.classList.remove('basic');
            form.classList.remove('advanced');
            form.classList.add(newValue);
          }}
        />
      </div>
      <div id={'basic-form'}>
        <div className={'form-row'}>
          <label htmlFor="health-stat">Health:</label>
          <RangeInput
            editable={true}
            id={'health-stat'}
            name={'health-stat'}
            defaultValue={character.optimizationPlan.rawHealth}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="protection-stat">Protection:</label>
          <RangeInput
            editable={true}
            id={'protection-stat'}
            name={'protection-stat'}
            defaultValue={character.optimizationPlan.rawProtection}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="speed-stat">Speed:</label>
          <RangeInput
            editable={true}
            id={'speed-stat'}
            name={'speed-stat'}
            defaultValue={character.optimizationPlan.rawSpeed}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="critChance-stat">Critical Chance %:</label>
          <RangeInput
            editable={true}
            id={'critChance-stat'}
            name={'critChance-stat'}
            defaultValue={character.optimizationPlan.rawCritChance}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="critDmg-stat">Critical Damage %:</label>
          <RangeInput
            editable={true}
            id={'critDmg-stat'}
            name={'critDmg-stat'}
            defaultValue={character.optimizationPlan.rawCritDmg}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="potency-stat">Potency %:</label>
          <RangeInput
            editable={true}
            id={'potency-stat'}
            name={'potency-stat'}
            defaultValue={character.optimizationPlan.rawPotency}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="tenacity-stat">Tenacity %:</label>
          <RangeInput
            editable={true}
            id={'tenacity-stat'}
            name={'tenacity-stat'}
            defaultValue={character.optimizationPlan.rawTenacity}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="offense-stat">Offense:</label>
          <RangeInput
            editable={true}
            id={'offense-stat'}
            name={'offense-stat'}
            defaultValue={character.optimizationPlan.rawOffense}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="defense-stat">Defense:</label>
          <RangeInput
            editable={true}
            id={'defense-stat'}
            name={'defense-stat'}
            defaultValue={character.optimizationPlan.rawDefense}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="accuracy-stat">Accuracy:</label>
          <RangeInput
            editable={true}
            id={'accuracy-stat'}
            name={'accuracy-stat'}
            defaultValue={character.optimizationPlan.rawAccuracy}
            min={-100}
            max={100}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="critAvoid-stat">Critical Avoidance:</label>
          <RangeInput
            editable={true}
            id={'critAvoid-stat'}
            name={'critAvoid-stat'}
            defaultValue={character.optimizationPlan.rawCritAvoid}
            min={-100}
            max={100}
          />
        </div>
      </div>
      <div id={'advanced-form'}>
        <div className={'form-row'}>
          <label htmlFor="health-stat-advanced">Health:</label>
          <input
            id={'health-stat-advanced'}
            name={'health-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.health}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="protection-stat">Protection:</label>
          <input
            id={'protection-stat-advanced'}
            name={'protection-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.protection}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="speed-stat">Speed:</label>
          <input
            id={'speed-stat-advanced'}
            name={'speed-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.speed}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="critChance-stat">Critical Chance %:</label>
          <input
            id={'critChance-stat-advanced'}
            name={'critChance-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.critChance}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="critDmg-stat">Critical Damage %:</label>
          <input
            id={'critDmg-stat-advanced'}
            name={'critDmg-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.critDmg}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="potency-stat">Potency %:</label>
          <input
            id={'potency-stat-advanced'}
            name={'potency-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.potency}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="tenacity-stat">Tenacity %:</label>
          <input
            id={'tenacity-stat-advanced'}
            name={'tenacity-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.tenacity}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="offense-stat">Offense:</label>
          <input
            id={'offense-stat-advanced'}
            name={'offense-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.offense}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="defense-stat">Defense:</label>
          <input
            id={'defense-stat-advanced'}
            name={'defense-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.defense}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="accuracy-stat">Accuracy:</label>
          <input
            id={'accuracy-stat-advanced'}
            name={'accuracy-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.accuracy}
          />
        </div>
        <div className={'form-row'}>
          <label htmlFor="critAvoid-stat">Critical Avoidance:</label>
          <input
            id={'critAvoid-stat-advanced'}
            name={'critAvoid-stat-advanced'}
            type={'number'}
            step={.01}
            defaultValue={character.optimizationPlan.critAvoid}
          />
        </div>
      </div>
      <div className={'actions'}>
        <button type={'button'} onClick={this.cancelEdit.bind(this)}>Cancel</button>
        <button type={'submit'}>Save</button>
      </div>
    </form>;
  }

  /**
   * Render a modal with instructions on how to use the optimizer
   * @returns Array[JSX Element]
   */
  instructionsModal() {
    return <div>
      <h2>How to use the mods optimizer</h2>
      <p>
        Welcome to my mods optimizer for Star Wars: Galaxy of Heroes! This application works on a simple principle:
        every stat should have some set value for a character, and if we know all of those values, then we can
        calculate how much a given mod, or set of mods, is worth for that character. From there, the tool knows how to
        find the set of mods that give the highest possible overall value for each of your characters without you
        needing to look through the hundreds of mods in your inventory!
      </p>
      <h3>Selecting characters to optimize</h3>
      <p>
        The mods optimizer will start out by considering all mods equipped on any character other than those that have
        had "Lock" selected as a target. Then, it will go down the list of selected characters, one by one, choosing the
        best mods it can find for each character, based on the selected target. As it finishes each character, it
        removes those mods from its consideration set. Therefore, the character that you want to have your absolute best
        mods should always be first among your selected characters. Usually, this means that you want the character who
        needs the most speed to be first.
      </p>
      <p>
        I suggest optimizing your arena team first, in order of required speed, then characters you use for raids,
        then characters for other game modes, like Territory Battles, Territory Wars, and events.
      </p>
      <h3>Picking the right values</h3>
      <p>
        Every character in the game has been given starting values for all stats that can be used by the optimizer to
        pick the best mods. These values have been named for their general purpose - hSTR Phase 1, PvP, and PvE, for
        example. Some characters have multiple different targets that you can select from. <strong>These targets, while
        directionally good for characters, are only a base suggestion!</strong> There are many reasons that you might
        want to pick different values than those listed by default in the optimizer: you might want to optimize for a
        different purpose (such as a phase 3 Sith Triumvirate Raid team, where speed can be detrimental), you might
        want to choose something different to optimize against, or you might simply have a better set of values that
        you want to employ.
      </p>
      <p>
        As a starting point, choose a target for each character that matches what you'd like to optimize for. If no
        such target exists, you can select "Custom", or simply hit the "Edit" button to bring up the character edit
        modal. Most characters will have the "basic" mode selected by default. In basic mode, you select a value for all
        stats that is between -100 and 100. These values are weights that are assigned to each stat to determine its
        value for that character. Setting two values as equal means that those stats are about equally important for
        that character. In basic mode, the optimizer will automatically adjust the weights to fit the range of values
        seen in-game for that stat. For example, giving speed and protection both a value of 100 means that 1 speed is
        about equivalent to 200 protection (since you find much more protection on mods than you do speed).
      </p>
      <p>
        If you want more fine-tuned control over the stat values, you can switch to "advanced" mode. In advanced mode,
        the values given are the value for each point of the listed stat. In advanced mode, if speed and protection are
        both given a value of 100, then the tool will never select speed, because it can more easily give that character
        much more protection. I suggest sticking to basic mode until you have a strong sense for how the tool works.
      </p>
      <p>
        I hope that you enjoy the tool! Happy modding!
      </p>
      <div className={'actions'}>
        <button type={'button'} onClick={() => this.setState({'instructions': false})}>OK</button>
      </div>
    </div>;
  }
}

export default CharacterEditView;
