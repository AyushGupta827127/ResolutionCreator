<template>
  <div class="mx-auto px-5 py-8 sm:px-10 lg:px-14" :class="phase === 'generating' ? 'max-w-2xl' : 'max-w-[1440px]'">
    <div v-if="pending" class="space-y-4 py-10">
      <div class="skeleton h-5 w-24" />
      <div class="skeleton h-9 w-2/3" />
      <div class="skeleton h-24 w-full" />
    </div>
    <div v-else-if="!resolution" class="py-24 text-center text-ink-400">Resolution not found.</div>

    <template v-else>
      <div v-if="phase !== 'intro' && phase !== 'wizard'" class="mb-8">
        <WizardStepTracker :steps="macroSteps" :current="macroStepIndex" />
      </div>

      <Transition name="fade" mode="out-in">
        <!-- RESOLUTION OVERVIEW -->
        <div v-if="phase === 'intro'" key="intro">
          <p class="flex items-center gap-1.5 text-sm text-ink-400">
            <NuxtLink to="/library" class="hover:text-ink-700">Library</NuxtLink>
            <Icon name="ph:caret-right-bold" class="h-3 w-3" />
            <span>{{ accent.label }}</span>
            <Icon name="ph:caret-right-bold" class="h-3 w-3" />
            <span class="text-ink-700">{{ resolution.title }}</span>
          </p>

          <Transition name="fade">
            <div v-if="hasDraft" class="mt-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-card">
              <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">Continue your draft</p>
              <p class="mt-1 font-sans text-lg font-semibold text-ink-950">{{ resolution.title }}</p>
              <p class="mt-1 text-sm text-ink-600">
                {{ draftPercent }}% complete<template v-if="draftSectionLabel"> · {{ draftSectionLabel }} in progress</template>
              </p>
              <div class="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white">
                <div class="h-full rounded-full bg-amber-500" :style="{ width: draftPercent + '%' }" />
              </div>
              <div class="mt-4 flex gap-2.5">
                <button class="btn-accent !px-4 !py-2 text-sm" @click="resumeDraft">
                  Continue draft <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5" />
                </button>
                <button class="btn-secondary !px-4 !py-2 text-sm" @click="discardDraft">Start over</button>
              </div>
            </div>
          </Transition>

          <!-- Hero panel -->
          <section class="mt-5 overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-br from-white via-[#F4F7FF] to-[#FFF6EE] p-5 shadow-card sm:p-6">
            <div class="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" :class="[accent.bg, accent.text]">
                    <Icon :name="accent.icon" class="h-3.5 w-3.5" /> {{ accent.label }}
                  </span>
                  <span class="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-medium text-ink-600">
                    {{ kindLabel(resolution.resolutionKind) }} Resolution
                  </span>
                </div>
                <h1 class="mt-3 max-w-[680px] font-sans text-[1.6rem] font-bold leading-[1.15] tracking-tight text-ink-950 sm:text-[2rem]">{{ resolution.title }}</h1>
                <p class="mt-2 max-w-[600px] text-[15px] leading-relaxed text-ink-500">{{ resolution.description }}</p>

                <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-600">
                  <li class="flex items-center gap-1.5"><Icon name="ph:list-checks-bold" class="h-4 w-4 text-violet-500" /> {{ resolution.questions.length }} questions</li>
                  <li class="flex items-center gap-1.5"><Icon name="ph:clock-bold" class="h-4 w-4 text-orange-500" /> {{ estimatedTime }}</li>
                  <li class="flex items-center gap-1.5"><Icon name="ph:users-bold" class="h-4 w-4 text-blue-500" /> {{ resolution.meetingType === "general" ? "General" : "Board" }} meeting</li>
                </ul>

                <div class="mt-5 flex flex-wrap items-center gap-4">
                  <button v-if="!hasDraft" class="btn-accent !px-6 !py-3 !text-[15px] shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)]" @click="start">
                    Start resolution <Icon name="ph:arrow-right-bold" class="h-4 w-4" />
                  </button>
                  <NuxtLink to="/library" class="text-sm font-medium text-ink-500 hover:text-ink-800">Back to library</NuxtLink>
                </div>
              </div>

              <div class="mx-auto hidden w-[150px] sm:block lg:w-[180px]">
                <HomeTemplateDocumentPreview :image="thumbImage" :title="resolution.title" eager class="!shadow-[0_14px_40px_-12px_rgba(30,27,75,0.3)]" />
              </div>
            </div>
          </section>

          <div class="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <h2 class="flex items-center gap-2 font-sans text-[15px] font-semibold text-ink-950">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Icon name="ph:list-checks-bold" class="h-4 w-4" /></span>
                What you'll provide
              </h2>
              <ul class="mt-3 space-y-2">
                <li v-for="s in overviewSections" :key="s" class="flex items-center gap-2.5 text-sm text-ink-600">
                  <Icon name="ph:check-circle-fill" class="h-4 w-4 shrink-0 text-green-500" /> {{ s }}
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <h2 class="flex items-center gap-2 font-sans text-[15px] font-semibold text-ink-950">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Icon name="ph:file-arrow-down-bold" class="h-4 w-4" /></span>
                What you'll get
              </h2>
              <ul class="mt-3 space-y-2">
                <li class="flex items-center gap-2.5 text-sm text-ink-600">
                  <Icon name="ph:check-circle-fill" class="h-4 w-4 shrink-0 text-green-500" /> Professionally formatted {{ kindLabel(resolution.resolutionKind) }} Resolution
                </li>
                <li class="flex items-center gap-2.5 text-sm text-ink-600">
                  <Icon name="ph:check-circle-fill" class="h-4 w-4 shrink-0 text-green-500" /> Compliance review
                </li>
                <li class="flex items-center gap-2.5 text-sm text-ink-600">
                  <Icon name="ph:check-circle-fill" class="h-4 w-4 shrink-0 text-green-500" /> PDF and Word export
                </li>
                <li class="flex items-center gap-2.5 text-sm text-ink-600">
                  <Icon name="ph:check-circle-fill" class="h-4 w-4 shrink-0 text-green-500" /> Saved copy in your account
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card md:col-span-2 lg:col-span-1">
              <h2 class="flex items-center gap-2 font-sans text-[15px] font-semibold text-ink-950">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon name="ph:info-bold" class="h-4 w-4" /></span>
                Resolution overview
              </h2>
              <dl class="mt-3 space-y-2.5 text-sm">
                <div class="flex items-center justify-between">
                  <dt class="text-ink-500">Category</dt>
                  <dd class="font-medium text-ink-900">{{ accent.label }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-ink-500">Meeting</dt>
                  <dd class="font-medium text-ink-900">{{ resolution.meetingType === "general" ? "General Meeting" : "Board Meeting" }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-ink-500">Questions</dt>
                  <dd class="font-medium text-ink-900">{{ resolution.questions.length }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-ink-500">Output</dt>
                  <dd class="font-medium text-ink-900">{{ kindLabel(resolution.resolutionKind) }} Resolution</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-ink-500">Estimated time</dt>
                  <dd class="font-medium text-ink-900">{{ estimatedTime }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- GUIDED QUESTIONS: whole sections, multiple related fields at once -->
        <div v-else-if="phase === 'wizard'" key="wizard" class="pb-32">
          <!-- Resolution context -->
          <section class="relative overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-br from-[#F4F7FF] via-white to-[#FFF6EE] px-5 py-4 shadow-card sm:px-7 sm:py-4">
            <div class="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <NuxtLink to="/library" class="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700">
                  <Icon name="ph:arrow-left-bold" class="h-3.5 w-3.5" /> Back to library
                </NuxtLink>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" :class="[accent.bg, accent.text]">
                    <Icon :name="accent.icon" class="h-3.5 w-3.5" /> {{ resolution.title }}
                  </span>
                  <span class="rounded-full border border-ink-100 bg-white px-3 py-1 text-xs font-medium text-ink-600">
                    {{ kindLabel(resolution.resolutionKind) }} Resolution
                  </span>
                </div>
                <h1 class="mt-2 font-sans text-[1.7rem] font-bold leading-[1.1] tracking-tight text-ink-950 sm:text-[2.1rem]">
                  Let's create your <span class="text-orange-500">resolution</span>
                </h1>
                <p class="mt-1.5 max-w-[650px] text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
                  Answer a few simple questions and we'll generate a professionally drafted resolution for you.
                </p>
              </div>

              <div class="relative hidden h-[118px] lg:block" aria-hidden="true">
                <div class="absolute -left-2 top-2 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl" />
                <div class="absolute bottom-0 right-4 h-24 w-24 rounded-full bg-orange-200/30 blur-2xl" />
                <div class="absolute right-8 top-0 w-[84px] -rotate-[5deg]">
                  <HomeTemplateDocumentPreview :image="thumbImage" :title="resolution.title" eager />
                </div>
                <div class="absolute bottom-0 left-2 flex max-w-[190px] items-start gap-2 rounded-xl border border-ink-100 bg-white p-2.5 shadow-card">
                  <Icon name="ph:check-circle-fill" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <p class="text-[12px] leading-snug text-ink-600">
                    You're creating a <span class="font-semibold text-ink-900">{{ kindLabel(resolution.resolutionKind) }} Resolution</span> — {{ resolution.title.toLowerCase() }}.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Horizontal section stepper -->
          <div class="mt-4">
            <WizardSectionStepper :sections="sidebarSections" @jump="jumpToSection" />
          </div>

          <!-- Workspace -->
          <div ref="workspaceRef" class="mt-4 grid scroll-mt-24 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_310px]">
            <aside class="no-scrollbar hidden lg:block lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
              <WizardSectionNav :sections="sidebarSections" @jump="jumpToSection" />
              <div class="mt-4 rounded-2xl border border-ink-100 bg-white p-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <div class="flex items-end justify-between">
                  <span class="text-xs font-medium text-ink-500">Resolution progress</span>
                  <span class="font-sans text-xl font-bold leading-none tabular-nums text-ink-950">{{ overallProgress }}%</span>
                </div>
                <div class="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div class="h-full rounded-full bg-orange-500 transition-all duration-300" :style="{ width: overallProgress + '%' }" />
                </div>
                <p v-if="minutesRemaining" class="mt-2.5 flex items-center gap-1 text-xs text-ink-400">
                  <Icon name="ph:clock-bold" class="h-3.5 w-3.5" /> ~{{ minutesRemaining }} min{{ minutesRemaining === 1 ? "" : "s" }} remaining
                </p>
              </div>
            </aside>

            <div class="min-w-0">
              <!-- Mobile / tablet: compact section selector -->
              <div class="mb-4 lg:hidden">
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-xl border border-ink-100 bg-white px-3.5 py-3 text-sm shadow-card"
                  :aria-expanded="showMobileSections"
                  @click="showMobileSections = !showMobileSections"
                >
                  <span>
                    <span class="block font-medium text-ink-900">{{ currentSection.name }}</span>
                    <span class="text-xs text-ink-400">Section {{ currentSectionIndex + 1 }} of {{ sections.length }} · {{ overallProgress }}% done</span>
                  </span>
                  <span class="flex items-center gap-1 text-xs font-medium text-orange-500">
                    Change section
                    <Icon name="ph:caret-down-bold" class="h-3.5 w-3.5 transition-transform" :class="showMobileSections ? 'rotate-180' : ''" />
                  </span>
                </button>
                <Transition name="fade">
                  <div v-if="showMobileSections" class="mt-2 rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
                    <WizardSectionNav
                      :sections="sidebarSections"
                      @jump="
                        (s) => {
                          jumpToSection(s);
                          showMobileSections = false;
                        }
                      "
                    />
                  </div>
                </Transition>
              </div>

              <!-- On wide screens the card is exactly one screen tall; long sections scroll inside it (scrollbar hidden, fade hints at more). -->
              <div class="relative">
              <Transition name="fade" mode="out-in" @after-enter="updateScrollHint">
                <div
                  :key="currentSection.name"
                  ref="formScroll"
                  class="no-scrollbar rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)] sm:p-8 lg:h-[calc(100vh-11rem)] lg:overflow-y-auto"
                  @scroll.passive="updateScrollHint"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div class="flex flex-wrap items-center gap-2.5">
                        <p class="text-xs font-bold uppercase tracking-[0.05em] text-[#7B84A3]">{{ currentSection.name }}</p>
                        <span
                          class="rounded-full px-2 py-0.5 text-xs font-medium"
                          :class="sectionIsComplete ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100' : 'bg-[#F5F7FA] text-ink-500 ring-1 ring-inset ring-[#E5E7EB]'"
                        >
                          {{ sidebarSections[currentSectionIndex]?.completed || 0 }} of {{ sidebarSections[currentSectionIndex]?.total || 0 }} complete
                        </span>
                      </div>
                      <h2 class="mt-2 font-sans text-[1.65rem] font-bold leading-[1.15] text-ink-950 sm:text-[2rem]">{{ sectionHeading(currentSection.name) }}</h2>
                      <p class="mt-1.5 max-w-[680px] text-[15px] leading-[1.5] text-ink-500">
                        These details will be used in the resolution and to fill relevant parts of the document.
                      </p>
                    </div>
                    <button
                      v-if="hasSavedDetailsForSection"
                      type="button"
                      class="btn-secondary shrink-0 !rounded-xl !px-3 !py-2 text-xs"
                      @click="useSavedDetailsForSection"
                    >
                      <Icon name="ph:database-bold" class="h-3.5 w-3.5" /> Use my saved details
                    </button>
                  </div>

                  <TransitionGroup name="field" tag="div" class="mt-6 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                    <div
                      v-for="q in currentSectionVisibleQuestions"
                      :key="q.id"
                      class="row-span-3 grid min-w-0 grid-cols-1 [grid-template-rows:subgrid]"
                      :class="wideFields.has(q.id) ? 'sm:col-span-2' : ''"
                    >
                      <WizardFieldInput
                        :question="q"
                        v-model="answers[q.field]"
                        :help="resolution.helpContent[q.field]"
                        :reused="isReused(q.field)"
                        :ai-suggested="isAiSuggested(q.field)"
                        :error="errorFor(q)"
                      />
                    </div>
                  </TransitionGroup>

                  <div class="mt-4 flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                    <Icon name="ph:lightbulb-bold" class="mt-0.5 h-[18px] w-[18px] shrink-0 text-violet-500" />
                    <p class="text-[13px] leading-relaxed text-ink-600">
                      This information will appear in your resolution exactly as you enter it. Make sure it matches your official records.
                    </p>
                  </div>
                </div>
              </Transition>
              <div
                v-if="canScrollMore"
                class="pointer-events-none absolute inset-x-px bottom-px hidden h-16 items-end justify-center rounded-b-2xl bg-gradient-to-t from-white via-white/90 to-transparent pb-2 lg:flex"
                aria-hidden="true"
              >
                <span class="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink-500 shadow-card ring-1 ring-ink-100">
                  <Icon name="ph:arrow-down-bold" class="h-3 w-3" /> More below
                </span>
              </div>
              </div>
            </div>

            <!-- AI assistant: right column on wide screens, below the form otherwise -->
            <aside class="lg:col-span-2 xl:col-span-1">
              <WizardAiAssistantPanel
                :resolution-title="resolution.title"
                :section-name="currentSection.name"
                :section-questions="currentSectionVisibleQuestions"
                :prefilled-labels="currentSectionPrefilledLabels"
                @apply="applyAiSuggestions"
              />
            </aside>
          </div>

          <!-- Sticky so Continue is never far from the content. -->
          <div class="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur">
            <div class="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-3 px-5 sm:px-10 lg:px-14">
              <button
                v-if="returnToReview"
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-300 hover:bg-ink-50"
                @click="returnToReview = false; phase = 'review'"
              >
                <Icon name="ph:arrow-left-bold" class="h-4 w-4" /> <span class="hidden sm:inline">Back to review</span><span class="sm:hidden">Review</span>
              </button>
              <button
                v-else-if="currentSectionIndex === 0"
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-300 hover:bg-ink-50"
                @click="navigateTo('/library')"
              >
                <Icon name="ph:arrow-left-bold" class="h-4 w-4" /> <span class="hidden sm:inline">Back to library</span><span class="sm:hidden">Back</span>
              </button>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-300 hover:bg-ink-50"
                @click="goBackSection"
              >
                <Icon name="ph:arrow-left-bold" class="h-4 w-4" /> Back
              </button>

              <div class="flex flex-col items-center">
                <button type="button" class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900" @click="saveAndExit">
                  <Icon name="ph:floppy-disk-bold" class="h-4 w-4" /> <span>Save<span class="hidden sm:inline"> &amp; exit</span></span>
                </button>
                <span v-if="draftStatus" class="hidden text-[11px] text-ink-400 sm:block" aria-live="polite">{{ draftStatus }}</span>
              </div>

              <button
                type="button"
                class="inline-flex h-12 items-center gap-2 rounded-full bg-orange-500 px-6 text-[15px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(249,115,22,0.6)] transition-colors hover:bg-orange-600 active:bg-orange-700"
                @click="goNextSection"
              >
                <span class="hidden sm:inline">{{ returnToReview ? "Save & return to review" : currentSectionIndex === sections.length - 1 ? "Review details" : "Continue to next section" }}</span>
                <span class="sm:hidden">{{ returnToReview ? "Save" : currentSectionIndex === sections.length - 1 ? "Review" : "Continue" }}</span>
                <Icon name="ph:arrow-right-bold" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- REVIEW + COMPLIANCE -->
        <div v-else-if="phase === 'review'" key="review" class="pb-32">
          <!-- Header -->
          <section class="rounded-3xl border border-ink-100 bg-gradient-to-br from-[#F4F7FF] via-white to-[#FFF6EE] px-5 py-5 shadow-card sm:px-7">
            <button type="button" class="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700" @click="phase = 'wizard'">
              <Icon name="ph:arrow-left-bold" class="h-3.5 w-3.5" /> Back to details
            </button>
            <div class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 class="font-sans text-[1.7rem] font-bold leading-[1.1] tracking-tight text-ink-950 sm:text-[2.1rem]">
                  Review your <span class="text-orange-500">resolution</span>
                </h1>
                <p class="mt-1.5 max-w-[680px] text-[15px] leading-relaxed text-ink-500">
                  Review the information we've collected, run the compliance check, and choose any additional documents you'd like to generate.
                </p>
              </div>
              <p class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
                <span><strong class="font-semibold text-ink-900">{{ reviewSections.length }}</strong> sections</span>
                <span class="text-ink-300" aria-hidden="true">·</span>
                <span><strong class="font-semibold text-ink-900">{{ reviewAnswerCount }}</strong> answers</span>
                <span class="text-ink-300" aria-hidden="true">·</span>
                <span><strong class="font-semibold text-ink-900">{{ includedDocCount }}</strong> extras</span>
              </p>
            </div>

            <!-- Lightweight workflow status -->
            <ol class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px]" aria-label="Review progress">
              <li class="flex items-center gap-1.5 font-medium text-emerald-700"><Icon name="ph:check-circle-fill" class="h-4 w-4" /> Answers checked</li>
              <Icon name="ph:caret-right-bold" class="h-3 w-3 text-ink-300" aria-hidden="true" />
              <li class="flex items-center gap-1.5 font-medium" :class="workflow.compliance.cls">
                <Icon :key="workflow.compliance.icon" :name="workflow.compliance.icon" class="h-4 w-4" :class="reviewState === 'running' ? 'animate-spin' : ''" /> Compliance review
                <span v-if="workflow.compliance.note" class="font-normal text-ink-500">· {{ workflow.compliance.note }}</span>
              </li>
              <Icon name="ph:caret-right-bold" class="h-3 w-3 text-ink-300" aria-hidden="true" />
              <li class="flex items-center gap-1.5 font-medium text-ink-600">
                <Icon name="ph:files-bold" class="h-4 w-4 text-ink-400" /> Additional documents
                <span class="font-normal text-ink-500">· {{ includedDocCount ? includedDocCount + " selected" : "optional" }}</span>
              </li>
              <Icon name="ph:caret-right-bold" class="h-3 w-3 text-ink-300" aria-hidden="true" />
              <li class="flex items-center gap-1.5 font-medium" :class="reviewState === 'ready' ? 'text-orange-600' : 'text-ink-400'">
                <Icon name="ph:file-text-bold" class="h-4 w-4" /> Generate
              </li>
            </ol>
          </section>

          <div class="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <!-- Left: answers + additional documents -->
            <div class="min-w-0 space-y-8">
              <div>
                <h2 class="flex items-center gap-2 font-sans text-[17px] font-semibold text-ink-950">
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Icon name="ph:list-checks-bold" class="h-4 w-4" /></span>
                  Your answers
                </h2>
                <div class="mt-3 md:columns-2 md:gap-4">
                  <div v-for="section in reviewSections" :key="section.name" class="mb-4 break-inside-avoid">
                    <ReviewSection :name="section.name" :items="section.items" @edit="() => editFromReview(section)" />
                  </div>
                </div>
              </div>

              <div>
                <h2 class="flex items-center gap-2 font-sans text-[17px] font-semibold text-ink-950">
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Icon name="ph:files-bold" class="h-4 w-4" /></span>
                  Additional documents
                </h2>
                <p class="mt-1 text-[13px] text-ink-500">Choose any additional documents you'd like to generate with this resolution.</p>
                <div class="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div
                    v-for="doc in extraDocs"
                    :key="doc.key"
                    :id="`extra-${doc.key}`"
                    class="flex flex-col rounded-2xl border bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-colors"
                    :class="doc.included ? 'border-emerald-300 bg-emerald-50/30' : 'border-ink-100'"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <span class="flex h-10 w-10 items-center justify-center rounded-xl" :class="doc.tint"><Icon :name="doc.icon" class="h-5 w-5" /></span>
                      <span v-if="doc.included" class="flex items-center gap-1 text-xs font-semibold text-emerald-700"><Icon name="ph:check-circle-fill" class="h-4 w-4" /> Selected</span>
                    </div>
                    <p class="mt-3 text-[15px] font-semibold text-ink-950">{{ doc.title }}</p>
                    <p class="mt-1 text-[13px] leading-snug text-ink-500">{{ doc.desc }}</p>
                    <button
                      type="button"
                      :aria-pressed="doc.included"
                      class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors"
                      :class="doc.included ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400'"
                      @click="toggleDoc(doc.key)"
                    >
                      <Icon v-if="doc.included" name="ph:check-bold" class="h-3.5 w-3.5" /> {{ doc.included ? "Included" : "Include" }}
                    </button>

                    <!-- Every field of an included document stays visible (typing never makes a field disappear). -->
                    <div v-if="doc.included && doc.fields.length" class="mt-3 space-y-3 border-t border-ink-100 pt-3">
                      <p class="text-xs text-ink-500">Details needed for this document:</p>
                      <div v-for="q in doc.fields" :key="q.id">
                        <label :for="`opt-${q.field}`" class="mb-1 flex items-center gap-1 text-xs font-medium text-ink-700">
                          {{ q.label }}
                          <span v-if="q.required" class="text-orange-500" aria-hidden="true">*</span>
                          <span v-if="q.required" class="sr-only">(required)</span>
                          <span v-else class="font-normal text-ink-400">Optional</span>
                        </label>
                        <textarea
                          v-if="q.type === 'textarea'"
                          :id="`opt-${q.field}`"
                          v-model="answers[q.field]"
                          rows="3"
                          class="field-input !py-2 text-sm"
                          :class="extraInvalid(q) ? '!border-red-300 !ring-2 !ring-red-100' : ''"
                          :placeholder="q.placeholder"
                          :aria-invalid="extraInvalid(q)"
                        />
                        <input
                          v-else
                          :id="`opt-${q.field}`"
                          v-model="answers[q.field]"
                          :type="extraInputType(q)"
                          class="field-input !py-2 text-sm"
                          :class="extraInvalid(q) ? '!border-red-300 !ring-2 !ring-red-100' : ''"
                          :placeholder="q.placeholder"
                          :aria-invalid="extraInvalid(q)"
                        />
                        <p v-if="extraInvalid(q)" class="mt-1 text-xs text-red-600" role="alert">{{ q.label }} is required.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: summary + compliance -->
            <aside id="compliance-panel" class="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
              <div class="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <div class="w-14 shrink-0"><HomeTemplateDocumentPreview :image="thumbImage" :title="resolution.title" /></div>
                <div class="min-w-0">
                  <p class="font-sans text-[15px] font-semibold leading-snug text-ink-950">{{ resolution.title }}</p>
                  <p class="mt-0.5 text-xs text-ink-500">{{ accent.label }} · {{ kindLabel(resolution.resolutionKind) }} Resolution</p>
                  <span class="status-draft badge mt-1.5">Draft</span>
                </div>
              </div>

              <Transition name="fade">
                <div v-if="generateError" id="generate-error" class="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm text-red-700" role="alert">
                  <p class="flex items-center gap-1.5 font-medium">
                    <Icon name="ph:warning-circle-bold" class="h-4 w-4 shrink-0" /> {{ generateError.message }}
                  </p>
                  <ul v-if="generateError.issues.length" class="mt-2 space-y-1">
                    <li v-for="(issue, i) in generateError.issues" :key="i" class="flex items-start justify-between gap-2">
                      <span>{{ issue.message }}</span>
                      <button v-if="issue.field" class="btn-ghost shrink-0 !px-2 !py-1 text-xs text-red-700 hover:bg-red-100" @click="fixField(issue.field)">Fix</button>
                    </li>
                  </ul>
                </div>
              </Transition>

              <Transition name="fade">
                <div v-if="finishingIssues.length" class="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm text-red-700">
                  <p v-for="(msg, i) in finishingIssues" :key="i" class="flex items-start gap-1.5">
                    <Icon name="ph:warning-circle-bold" class="mt-0.5 h-4 w-4 shrink-0" /> {{ msg }}
                  </p>
                </div>
              </Transition>

              <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <div class="flex items-center gap-2.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Icon name="ph:shield-check-bold" class="h-4 w-4" /></span>
                  <h2 class="font-sans text-[16px] font-semibold text-ink-950">Compliance review</h2>
                </div>
                <p class="mt-2 text-[13px] leading-relaxed text-ink-500">
                  Before generating the final resolution, we check the information against the applicable requirements and guidance.
                </p>

                <button
                  v-if="!complianceChecked"
                  type="button"
                  class="btn-primary mt-4 w-full !rounded-xl"
                  :disabled="complianceLoading"
                  @click="reviewCompliance"
                >
                  <Icon v-if="complianceLoading" name="ph:circle-notch-bold" class="h-4 w-4 animate-spin" />
                  <Icon v-else name="ph:shield-check-bold" class="h-4 w-4" />
                  {{ complianceLoading ? "Checking compliance…" : "Review compliance" }}
                </button>

                <Transition name="fade">
                  <div v-if="complianceChecked" class="mt-4">
                    <ComplianceSummary :items="complianceDisplay" @fix="fixFromCompliance" />
                    <p v-if="narration" class="mt-3 flex items-start gap-2 rounded-xl bg-violet-50/60 p-3 text-[13px] leading-relaxed text-ink-700">
                      <Icon name="ph:sparkle-fill" class="mt-0.5 h-4 w-4 shrink-0 text-violet-500" /> {{ narration }}
                    </p>
                  </div>
                </Transition>
              </div>

            </aside>
          </div>

          <!-- Sticky generate bar: Generate is always reachable, and says why when it isn't -->
          <div class="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur">
            <div class="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-3 sm:min-h-[76px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10 lg:px-14">
              <div class="min-w-0 text-sm" aria-live="polite">
                <p v-if="finishingIssues.length && reviewState !== 'running'" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-red-700">
                  <span class="flex items-center gap-2 font-medium">
                    <Icon name="ph:warning-circle-fill" class="h-[18px] w-[18px] shrink-0" /> {{ finishingIssues.length }} detail{{ finishingIssues.length === 1 ? "" : "s" }} still needed for the documents you selected
                  </span>
                  <button type="button" class="font-semibold underline underline-offset-2 hover:text-red-900" @click="focusFirstMissingExtra">Complete details</button>
                </p>
                <p v-else-if="reviewState === 'notChecked'" class="flex items-center gap-2 text-ink-600">
                  <Icon name="ph:shield-check-bold" class="h-[18px] w-[18px] shrink-0 text-ink-400" />
                  Run the compliance review to unlock generating.
                </p>
                <p v-else-if="reviewState === 'running'" class="flex items-center gap-2 text-ink-600">
                  <Icon name="ph:circle-notch-bold" class="h-[18px] w-[18px] shrink-0 animate-spin text-ink-400" /> Checking your resolution against the requirements…
                </p>
                <p v-else-if="reviewState === 'blocked'" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-red-700">
                  <span class="flex items-center gap-2 font-medium">
                    <Icon name="ph:warning-octagon-fill" class="h-[18px] w-[18px] shrink-0" /> {{ counts.blocking }} issue{{ counts.blocking === 1 ? "" : "s" }} need{{ counts.blocking === 1 ? "s" : "" }} attention
                  </span>
                  <button type="button" class="font-semibold underline underline-offset-2 hover:text-red-900" @click="goToFirstIssue">Review issue</button>
                </p>
                <label v-else-if="reviewState === 'needsAck'" class="flex cursor-pointer items-center gap-2.5 text-ink-700">
                  <input v-model="warningsAcknowledged" type="checkbox" class="h-4 w-4 accent-orange-500" />
                  <span><span class="font-medium">I've reviewed the {{ counts.warning }} action item{{ counts.warning === 1 ? "" : "s" }} above</span> <span class="text-ink-500">· {{ counts.pass }} passed · {{ counts.information }} informational</span></span>
                </label>
                <p v-else class="flex items-center gap-2 font-medium text-emerald-700">
                  <Icon name="ph:check-circle-fill" class="h-[18px] w-[18px] shrink-0" /> Review complete
                  <span class="font-normal text-ink-500">· {{ counts.pass }} passed · {{ counts.information }} informational {{ counts.information === 1 ? "note" : "notes" }}</span>
                </p>
              </div>

              <button
                type="button"
                class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(249,115,22,0.6)] transition-colors disabled:pointer-events-none disabled:opacity-45"
                :class="reviewState === 'blocked' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'"
                :disabled="primaryDisabled"
                @click="onPrimaryAction"
              >
                <Icon v-if="reviewState === 'running'" name="ph:circle-notch-bold" class="h-4 w-4 animate-spin" />
                {{ primaryLabel }}
                <Icon v-if="reviewState === 'ready' || reviewState === 'needsAck'" name="ph:arrow-right-bold" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- GENERATING -->
        <div v-else-if="phase === 'generating'" key="generating" class="mx-auto flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-ink-100 bg-white px-8 py-12 text-center shadow-card">
          <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><Icon name="ph:sparkle-fill" class="h-7 w-7" /></span>
          <h2 class="mt-5 font-sans text-xl font-bold text-ink-950">Generating your resolution</h2>
          <ul class="mt-7 space-y-3 text-left">
            <li
              v-for="(step, i) in generationSteps"
              :key="step"
              class="flex items-center gap-3 text-sm transition-colors"
              :class="i <= generationStepIndex ? 'text-ink-900' : 'text-ink-300'"
            >
              <Icon
                v-if="i < generationStepIndex || generationStepIndex >= generationSteps.length"
                name="ph:check-circle-fill"
                class="h-5 w-5 text-green-500"
              />
              <Icon v-else-if="i === generationStepIndex" name="ph:circle-notch-bold" class="h-5 w-5 animate-spin text-ink-500" />
              <Icon v-else name="ph:circle" class="h-5 w-5 text-ink-200" />
              {{ step }}
            </li>
          </ul>
        </div>

        <!-- RESOLUTION WORKSPACE -->
        <div v-else-if="phase === 'generated' && result" key="generated">
          <!-- Where am I / is anything wrong / what next -->
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 class="font-sans text-[1.75rem] font-bold tracking-tight text-ink-950">Resolution ready</h1>
              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
                <span class="badge status-draft uppercase tracking-wide">Draft</span>
                <span class="text-ink-500">Generated {{ generatedLabel }}</span>
                <span class="flex items-center gap-1 font-medium text-emerald-700"><Icon name="ph:check-circle-fill" class="h-4 w-4" /> {{ resultCounts.pass }} passed</span>
                <span v-if="resultCounts.information" class="flex items-center gap-1 font-medium text-blue-600"><Icon name="ph:info-bold" class="h-4 w-4" /> {{ resultCounts.information }} informational {{ resultCounts.information === 1 ? "note" : "notes" }}</span>
                <span v-if="resultCounts.actionRequired" class="flex items-center gap-1 font-medium text-amber-700"><Icon name="ph:warning-bold" class="h-4 w-4" /> {{ resultCounts.actionRequired }} acknowledged</span>
              </div>
              <ul class="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs" aria-label="Documents in this package">
                <li class="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700"><Icon name="ph:check-bold" class="h-3 w-3" /> Resolution &amp; minutes</li>
                <li v-if="result.notice" class="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700"><Icon name="ph:check-bold" class="h-3 w-3" /> Notice of Meeting</li>
                <li v-if="result.ctc" class="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700"><Icon name="ph:check-bold" class="h-3 w-3" /> Certified True Copy</li>
                <li v-if="result.letterhead" class="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700"><Icon name="ph:check-bold" class="h-3 w-3" /> Letterhead</li>
              </ul>
              <p class="mt-1.5 max-w-[640px] text-xs leading-relaxed text-ink-400">
                This is a generated draft, not a legally finalised document. Review the details with a qualified professional before using or filing it.
              </p>
            </div>
            <button type="button" class="btn-ghost" @click="requestStartAnother">
              <Icon name="ph:arrow-counter-clockwise-bold" class="h-4 w-4" /> Start another
            </button>
          </div>

          <div class="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
            <div class="min-w-0">
              <!-- Actions: one primary, then downloads, then secondary tools -->
              <div class="rounded-2xl border border-ink-100 bg-white p-3 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <div class="flex flex-wrap items-center gap-2.5">
                  <button type="button" class="btn-accent !rounded-xl !px-5 !py-2.5" @click="downloadPdf">
                    <Icon name="ph:file-pdf-bold" class="h-4 w-4" /> Download PDF
                  </button>
                  <button type="button" class="btn-secondary !rounded-xl !px-4 !py-2.5" @click="downloadDocx">
                    <Icon name="ph:file-doc-bold" class="h-4 w-4" /> Download Word
                  </button>
                  <button type="button" class="btn-secondary !rounded-xl !px-4 !py-2.5" @click="printDocument">
                    <Icon name="ph:printer-bold" class="h-4 w-4" /> Print
                  </button>
                </div>
                <div class="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-ink-100 pt-2.5">
                  <button type="button" class="btn-ghost" @click="showEditModal = true">
                    <Icon name="ph:pencil-simple-bold" class="h-4 w-4" /> Edit answers
                  </button>
                  <button type="button" class="btn-ghost !text-violet-700 hover:!bg-violet-50" :disabled="refining" @click="showRefineModal = true">
                    <Icon v-if="refining" name="ph:circle-notch-bold" class="h-4 w-4 animate-spin" />
                    <Icon v-else name="ph:sparkle-fill" class="h-4 w-4 text-violet-500" />
                    {{ refining ? "Refining…" : "Refine wording" }}
                  </button>
                  <button v-if="refinedBody" type="button" class="btn-ghost text-orange-600" @click="refinedBody = ''">
                    <Icon name="ph:x-bold" class="h-3.5 w-3.5" /> Discard AI suggestion
                  </button>
                  <span class="mx-1 hidden h-5 w-px bg-ink-200 sm:block" aria-hidden="true" />
                  <!-- Saving costs a credit, so it stays explicit; it only shows when there is something to save. -->
                  <button v-if="hasUnsavedChanges" type="button" class="btn-ghost" :disabled="saving" @click="saveToHistory">
                    <Icon v-if="saving" name="ph:circle-notch-bold" class="h-4 w-4 animate-spin" />
                    <Icon v-else name="ph:floppy-disk-bold" class="h-4 w-4" />
                    {{ saving ? "Saving…" : !user ? "Sign in to save" : savedAt ? "Save changes" : "Save to my account" }}
                  </button>
                  <span v-else class="flex items-center gap-1.5 px-2 text-[13px] font-medium text-emerald-700">
                    <Icon name="ph:check-circle-fill" class="h-4 w-4" /> Saved just now
                  </span>
                </div>
              </div>
              <Transition name="fade">
                <p v-if="saveMessage && (saveError || hasUnsavedChanges)" class="mt-2 flex items-center gap-1.5 text-sm" :class="saveError ? 'text-red-600' : 'text-green-700'">
                  <Icon :key="saveError ? 'err' : 'ok'" :name="saveError ? 'ph:warning-circle-bold' : 'ph:check-circle-bold'" class="h-4 w-4" />
                  {{ saveMessage }}
                </p>
              </Transition>

              <!-- The document is the primary artifact on this page. -->
              <div id="print-area" ref="printRef" class="mt-5">
                <DocumentPreview
                  :document="result.document"
                  :notice="result.notice"
                  :ctc="result.ctc"
                  :letterhead="result.letterhead"
                  :refined-body="refinedBody"
                />
              </div>

              <div class="mt-8">
                <ResolutionBreakdown :result="result" :resolution="resolution" :answers="answers" />
              </div>
            </div>

            <aside class="lg:sticky lg:top-24 lg:self-start">
              <ResolutionSidebar :result="result" :resolution="resolution" />
            </aside>
          </div>
        </div>
      </Transition>
    </template>

    <Transition name="fade">
      <UtilAuthModal v-if="showAuth" @close="showAuth = false" />
    </Transition>
    <Transition name="fade">
      <EditAnswersModal
        v-if="showEditModal"
        :questions="resolution.questions"
        :answers="answers"
        @cancel="showEditModal = false"
        @save="applyEditedAnswers"
      />
    </Transition>
    <Transition name="fade">
      <div v-if="showStartAnotherConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 px-4" role="dialog" aria-modal="true" aria-labelledby="sa-title">
        <div class="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-6 shadow-card-hover">
          <h2 id="sa-title" class="font-sans text-lg font-bold text-ink-950">Start another resolution?</h2>
          <p class="mt-2 text-sm leading-relaxed text-ink-600">Your current resolution has unsaved changes.</p>
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" class="btn-secondary !rounded-xl" @click="showStartAnotherConfirm = false">Keep editing</button>
            <button type="button" class="btn-accent !rounded-xl" @click="showStartAnotherConfirm = false; reset()">Start another</button>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="fade">
      <RefineWordingModal v-if="showRefineModal" @cancel="showRefineModal = false" @apply="refineWithAi" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuth } from "@/composables/useAuth";
import { useKnownFacts } from "@/composables/useKnownFacts";
import { useProfileStore } from "@/stores/useProfileStore";
import { useCategoryAccent } from "@/composables/useCategoryAccent";
import { getAuthHeaders } from "@/composables/useAuthHeaders";
import { buildComplianceDisplay, complianceCounts } from "@/composables/useComplianceDisplay";

const route = useRoute();
const { data: resolution, pending } = await useFetch(`/api/resolutions/${route.params.slug}`);

useHead(() => ({ title: resolution.value?.title || "Resolution" }));

const { user } = useAuth();
const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore);
const { facts: knownFacts, remember } = useKnownFacts();

const accent = computed(() => useCategoryAccent(resolution.value?.category));
const thumbImage = computed(() => `/assets/templates/${route.params.slug}.svg`);
const kindLabel = (kind) => ({ board: "Board", ordinary: "Ordinary", special: "Special" }[kind] || "");

const overviewSections = computed(() => {
  const order = [];
  for (const q of resolution.value?.questions || []) if (!order.includes(q.section)) order.push(q.section);
  return order;
});

// ~20-30 seconds per question is a reasonable guided-form pace.
const estimatedTime = computed(() => {
  const n = resolution.value?.questions.length || 0;
  const low = Math.max(1, Math.round((n * 20) / 60));
  const high = Math.max(low + 1, Math.round((n * 30) / 60));
  return `${low}–${high} minutes`;
});

const phase = ref("intro");
const answers = reactive({});
const currentSectionIndex = ref(0);
const sectionAttempted = ref(false);
// field -> value at the moment it was prefilled/AI-applied, so a field
// reads as "reused"/"AI suggestion" only until the user actually edits it.
const prefilledValues = reactive({});
const aiAppliedValues = reactive({});

const includeNotice = ref(false);
const includeCtc = ref(false);
const includeLetterhead = ref(false);
const complianceChecked = ref(false);
const complianceLoading = ref(false);
const compliance = ref([]);
const narration = ref("");
const warningsAcknowledged = ref(false);
const generating = ref(false);
const result = ref(null);
const refinedBody = ref("");
const refining = ref(false);
const saving = ref(false);
const saveMessage = ref("");
const saveError = ref(false);
const showAuth = ref(false);
const printRef = ref(null);
const hasDraft = ref(false);
const generateError = ref(null);
const showEditModal = ref(false);
const showRefineModal = ref(false);
const showMobileSections = ref(false);
const workspaceRef = ref(null);
const formScroll = ref(null);
const canScrollMore = ref(false);
const draftStatus = ref("");
let draftStatusTimer;

const generationSteps = ["Validating company information", "Applying resolution template", "Applying compliance notes", "Preparing document"];
const generationStepIndex = ref(0);

const macroSteps = ["Choose", "Details", "Review", "Generate"];
const macroStepIndex = computed(() => {
  if (phase.value === "generated") return 3;
  if (phase.value === "generating") return 3;
  if (phase.value === "review") return 2;
  return 1;
});

const draftKey = `resolution-draft:${route.params.slug}`;
const draftPreview = ref(null);

// Read after mount so the server-rendered and first client render agree (no hydration mismatch).
onMounted(() => {
  const raw = localStorage.getItem(draftKey);
  if (raw) {
    try {
      draftPreview.value = JSON.parse(raw);
      hasDraft.value = true;
    } catch {
      // corrupt draft — treated as no draft
    }
  }
});

const draftPercent = computed(() => {
  if (!draftPreview.value || !resolution.value?.questions.length) return 0;
  const answered = Object.keys(draftPreview.value.answers || {}).length;
  return Math.min(100, Math.round((answered / resolution.value.questions.length) * 100));
});

const draftSectionLabel = computed(() => {
  if (!draftPreview.value || !sections.value.length) return "";
  return sections.value[draftPreview.value.currentSectionIndex || 0]?.name || "";
});

function matchesConditions(question) {
  if (!question.conditions?.length) return true;
  return question.conditions.every((c) => (c.operator === "eq" ? answers[c.field] === c.value : true));
}

// Static section grouping (order preserved) from the full question list —
// conditional VISIBILITY within a section is applied separately per render,
// since it depends on live answers.
const sections = computed(() => {
  if (!resolution.value) return [];
  const order = [];
  const map = new Map();
  for (const q of resolution.value.questions) {
    if (!map.has(q.section)) {
      map.set(q.section, []);
      order.push(q.section);
    }
    map.get(q.section).push(q);
  }
  return order.map((name) => ({ name, questions: map.get(name) }));
});

const currentSection = computed(() => sections.value[currentSectionIndex.value] || { name: "", questions: [] });
const currentSectionVisibleQuestions = computed(() => currentSection.value.questions.filter(matchesConditions));

// Layout only: which visible fields span both columns. Long/structured inputs
// are always full width; a short field that would be left alone on its row
// (next one is full width, or it's the last) is widened too, so no row has a hole.
const isWideField = (q) => ["textarea", "select"].includes(q.type) || q.options?.length > 2;
const wideFields = computed(() => {
  const list = currentSectionVisibleQuestions.value;
  const wide = new Set();
  for (let i = 0; i < list.length; ) {
    if (isWideField(list[i])) {
      wide.add(list[i].id);
      i += 1;
    } else if (i + 1 < list.length && !isWideField(list[i + 1])) {
      i += 2;
    } else {
      wide.add(list[i].id);
      i += 1;
    }
  }
  return wide;
});

const visibleQuestions = computed(() => (resolution.value ? resolution.value.questions.filter(matchesConditions) : []));

function isReused(field) {
  return field in prefilledValues && answers[field] === prefilledValues[field];
}
function isAiSuggested(field) {
  return field in aiAppliedValues && answers[field] === aiAppliedValues[field];
}

function errorFor(question) {
  if (!sectionAttempted.value) return "";
  if (question.required && (answers[question.field] === undefined || answers[question.field] === "")) {
    return `${question.label} is required.`;
  }
  return "";
}

const currentSectionPrefilledLabels = computed(() =>
  currentSectionVisibleQuestions.value.filter((q) => isReused(q.field)).map((q) => q.label)
);

const hasSavedDetailsForSection = computed(() =>
  currentSectionVisibleQuestions.value.some((q) => q.smartDefault && knownFacts[q.field] !== undefined && !answers[q.field])
);

function useSavedDetailsForSection() {
  for (const q of currentSectionVisibleQuestions.value) {
    if (q.smartDefault && knownFacts[q.field] !== undefined) {
      answers[q.field] = knownFacts[q.field];
      prefilledValues[q.field] = knownFacts[q.field];
    }
  }
}

function applyAiSuggestions(values) {
  for (const [field, value] of Object.entries(values)) {
    answers[field] = value;
    aiAppliedValues[field] = value;
  }
}

const SECTION_HEADINGS = [
  { match: "company", heading: "Tell us about the company" },
  { match: "meeting", heading: "When and where is the meeting?" },
  { match: "bank", heading: "Bank account details" },
  { match: "signator", heading: "Who can operate the account?" },
  { match: "filing", heading: "Filing and documentation" },
  { match: "director", heading: "Director details" },
  { match: "disclosure", heading: "Disclosure details" },
  { match: "authorisation", heading: "Authorisation" },
  { match: "notice pairing", heading: "Notice pairing" },
];
function sectionHeading(name) {
  const found = SECTION_HEADINGS.find((s) => name.toLowerCase().includes(s.match));
  return found ? found.heading : `Tell us about ${name.toLowerCase()}`;
}

// Progress is field-based (required + currently-visible fields answered),
// not screen-count based — conditional fields change the denominator as
// the user answers, exactly as they change what's actually required.
const requiredVisibleQuestions = computed(() => (resolution.value ? resolution.value.questions.filter((q) => q.required && matchesConditions(q)) : []));
const overallProgress = computed(() => {
  if (!requiredVisibleQuestions.value.length) return 0;
  const done = requiredVisibleQuestions.value.filter((q) => answers[q.field] !== undefined && answers[q.field] !== "").length;
  return Math.round((done / requiredVisibleQuestions.value.length) * 100);
});
const minutesRemaining = computed(() => {
  const remaining = requiredVisibleQuestions.value.filter((q) => answers[q.field] === undefined || answers[q.field] === "").length;
  return Math.max(0, Math.ceil((remaining * 20) / 60));
});

function start() {
  for (const q of resolution.value.questions) {
    if (q.smartDefault && knownFacts[q.field] !== undefined) {
      answers[q.field] = knownFacts[q.field];
      prefilledValues[q.field] = knownFacts[q.field];
    }
  }
  currentSectionIndex.value = 0;
  phase.value = "wizard";
}

function resumeDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey));
    if (saved?.answers) Object.assign(answers, saved.answers);
    currentSectionIndex.value = saved?.currentSectionIndex || 0;
  } catch {
    // corrupt draft — fall through to a fresh start
  }
  hasDraft.value = false;
  phase.value = "wizard";
}

function discardDraft() {
  localStorage.removeItem(draftKey);
  hasDraft.value = false;
  start();
}

// Autosave in-progress answers so a refresh or an accidental tab-close
// doesn't lose the wizard's progress — same pattern `template` uses for
// its own template-editor drafts.
watch(
  answers,
  () => {
    if (import.meta.client && phase.value === "wizard" && Object.keys(answers).length) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ answers: { ...answers }, currentSectionIndex: currentSectionIndex.value })
      );
      draftStatus.value = "Saving…";
      clearTimeout(draftStatusTimer);
      draftStatusTimer = setTimeout(() => (draftStatus.value = "Saved just now"), 400);
    }
  },
  { deep: true }
);

function goNextSection() {
  sectionAttempted.value = true;
  const visible = currentSectionVisibleQuestions.value;
  const missing = visible.some((q) => q.required && (answers[q.field] === undefined || answers[q.field] === ""));
  if (missing) return;

  for (const q of visible) {
    if (q.smartDefault && answers[q.field]) remember(q.field, answers[q.field]);
  }

  sectionAttempted.value = false;
  if (returnToReview.value) {
    returnToReview.value = false;
    phase.value = "review";
    return;
  }
  if (currentSectionIndex.value < sections.value.length - 1) {
    currentSectionIndex.value += 1;
  } else {
    phase.value = "review";
  }
}

function goBackSection() {
  sectionAttempted.value = false;
  if (currentSectionIndex.value > 0) currentSectionIndex.value -= 1;
}

function saveAndExit() {
  // Answers already autosave on every change (see the `answers` watcher
  // above) — this just confirms it and takes the user back to the library.
  navigateTo("/library");
}

// "Fix" for a field the server rejected: an Additional-documents field is on this screen; anything else is in the questionnaire.
function fixField(field) {
  const el = document.getElementById(`opt-${field}`);
  if (el) {
    showExtraErrors.value = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  } else fixFromCompliance([field]);
}

// "Fix this" on a compliance finding: open the section holding the first of its fields.
function fixFromCompliance(fields = []) {
  const field = fields.find((f) => resolution.value?.questions.some((q) => q.field === f));
  returnToReview.value = true;
  if (field) jumpToField(field);
  else phase.value = "wizard";
}

function jumpToField(field) {
  const q = resolution.value?.questions.find((q) => q.field === field);
  const idx = q ? sections.value.findIndex((s) => s.name === q.section) : 0;
  currentSectionIndex.value = idx >= 0 ? idx : 0;
  phase.value = "wizard";
}

// Drives the wizard's section sidebar: status (done/current/upcoming) +
// per-section "x/y complete" count, recalculated as conditions change.
const sidebarSections = computed(() =>
  sections.value.map((sec, idx) => {
    const visible = sec.questions.filter(matchesConditions);
    const completed = visible.filter((q) => answers[q.field] !== undefined && answers[q.field] !== "").length;
    let status = "upcoming";
    if (phase.value !== "wizard") status = "done";
    else if (idx === currentSectionIndex.value) status = "current";
    else if (idx < currentSectionIndex.value || idx <= maxSectionReached.value) status = "done"; // already visited -> reachable
    return { name: sec.name, total: visible.length, completed, status };
  })
);

// Furthest section the user has reached, so after "Review -> Edit details" every
// visited section stays clickable instead of only those before the current one.
const maxSectionReached = ref(0);
watch(currentSectionIndex, (i) => (maxSectionReached.value = Math.max(maxSectionReached.value, i)));
watch(phase, (ph) => {
  if (ph === "review") {
    maxSectionReached.value = Math.max(0, sections.value.length - 1);
    returnToReview.value = false;
  }
});

// What the answers say, ignoring the optional-document fields typed on the Review screen.
// When it changes, an earlier compliance result is stale and must be re-run.
const answersSignature = computed(() => {
  const keys = (resolution.value?.questions || []).map((q) => q.field);
  return JSON.stringify(keys.map((k) => [k, answers[k] ?? null]));
});
watch(answersSignature, () => {
  if (!complianceChecked.value) return;
  complianceChecked.value = false;
  compliance.value = [];
  narration.value = "";
  warningsAcknowledged.value = false;
  generateError.value = null;
});

// Review screen state machine — drives the workflow strip and the sticky Generate bar.
const reviewState = computed(() => {
  if (complianceLoading.value) return "running";
  if (!complianceChecked.value) return "notChecked";
  if (counts.value.blocking) return "blocked";
  if (counts.value.warning && !warningsAcknowledged.value) return "needsAck";
  return "ready";
});
const primaryLabel = computed(
  () =>
    (finishingIssues.value.length && reviewState.value !== "running" && "Complete document details") ||
    ({
      notChecked: "Review compliance first",
      running: "Checking compliance…",
      blocked: `Resolve ${counts.value.blocking} issue${counts.value.blocking === 1 ? "" : "s"} first`,
      needsAck: "Generate resolution",
      ready: "Generate resolution",
    })[reviewState.value]
);
const primaryDisabled = computed(() => reviewState.value === "running" || (reviewState.value === "needsAck" && !warningsAcknowledged.value && !finishingIssues.value.length));
function onPrimaryAction() {
  if (finishingIssues.value.length && reviewState.value !== "running") return focusFirstMissingExtra();
  if (reviewState.value === "notChecked") runComplianceCheck();
  else if (reviewState.value === "blocked") goToFirstIssue();
  else if (reviewState.value === "ready" || (reviewState.value === "needsAck" && warningsAcknowledged.value)) startGenerate();
}
function goToFirstIssue() {
  const first = complianceDisplay.value.find((i) => i.severity === "critical");
  if (first?.fields?.length) fixFromCompliance(first.fields);
  else document.getElementById("compliance-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
const workflow = computed(() => {
  const st = reviewState.value;
  if (st === "running") return { compliance: { icon: "ph:circle-notch-bold", cls: "text-ink-700", note: "checking…" } };
  if (st === "notChecked") return { compliance: { icon: "ph:circle", cls: "text-ink-700", note: "next step" } };
  if (st === "blocked") return { compliance: { icon: "ph:warning-octagon-fill", cls: "text-red-700", note: `${counts.value.blocking} to fix` } };
  if (st === "needsAck") return { compliance: { icon: "ph:warning-bold", cls: "text-amber-700", note: "confirm to continue" } };
  return { compliance: { icon: "ph:check-circle-fill", cls: "text-emerald-700", note: "complete" } };
});

// Coming from Review ("Edit" / "Fix this"): editing returns straight to Review instead of
// walking forward through every remaining section.
const returnToReview = ref(false);
function editFromReview(section) {
  returnToReview.value = true;
  jumpToSection(section);
}

// Generated page: what's saved, what changed since, and the "start another" guard.
const savedAt = ref(null);
const savedRefinedSnapshot = ref("");
const hasUnsavedChanges = computed(() => !savedAt.value || savedRefinedSnapshot.value !== refinedBody.value);
const showStartAnotherConfirm = ref(false);
function requestStartAnother() {
  if (hasUnsavedChanges.value) showStartAnotherConfirm.value = true;
  else reset();
}
const resultCounts = computed(() =>
  result.value ? complianceCounts(buildComplianceDisplay(resolution.value.complianceRules, result.value.compliance)) : complianceCounts([])
);
const generatedLabel = computed(() =>
  result.value ? new Date(result.value.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""
);

const sectionIsComplete = computed(() => {
  const sec = sidebarSections.value[currentSectionIndex.value];
  return !!sec && sec.total > 0 && sec.completed === sec.total;
});

function updateScrollHint() {
  const el = formScroll.value;
  canScrollMore.value = !!el && el.scrollHeight - el.scrollTop - el.clientHeight > 12;
}

// Bring the (one-screen-tall) workspace into view whenever the section changes or the wizard opens.
watch([currentSectionIndex, phase], async ([, ph]) => {
  if (ph === "review" && import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" });
  if (ph !== "wizard" || !import.meta.client) return;
  await nextTick();
  // the intro/section card is still fading out (mode="out-in"), so wait for the workspace to mount
  setTimeout(() => {
    workspaceRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
    updateScrollHint();
  }, 320);
});
// Conditional fields appearing/disappearing change the content height.
watch(() => currentSectionVisibleQuestions.value.length, () => nextTick(updateScrollHint));

function jumpToSection(section) {
  const idx = sections.value.findIndex((s) => s.name === section.name);
  currentSectionIndex.value = idx >= 0 ? idx : 0;
  phase.value = "wizard";
}

// The grouped, human-readable answer summary shown on the Review screen.
const reviewSections = computed(() =>
  sections.value.map((sec) => ({
    name: sec.name,
    items: sec.questions
      .filter((q) => matchesConditions(q) && answers[q.field] !== undefined && answers[q.field] !== "")
      .map((q) => ({
        label: q.label,
        value: q.type === "radio" && typeof answers[q.field] === "boolean" ? (answers[q.field] ? "Yes" : "No") : String(answers[q.field]),
      })),
  }))
);

const reviewAnswerCount = computed(() => reviewSections.value.reduce((n, sec) => n + sec.items.length, 0));
const includedDocCount = computed(() => [includeNotice.value && resolution.value?.meetingType === "board", includeCtc.value, includeLetterhead.value].filter(Boolean).length);

// ---- Additional documents (Notice / CTC / Letterhead) ----
// Each lists ALL of its questions once included. (It used to list only the empty ones, so a field
// vanished as soon as you typed one letter into it.)
const extraRefs = { notice: includeNotice, ctc: includeCtc, letterhead: includeLetterhead };
const extraDocs = computed(() => {
  if (!resolution.value) return [];
  const r = resolution.value;
  return [
    { key: "notice", title: "Notice of Meeting", desc: "A formal notice to accompany the resolution.", icon: "ph:bell-ringing-bold", tint: "bg-amber-50 text-amber-600", fields: r.notice.questions, show: r.meetingType === "board" },
    { key: "ctc", title: "Certified True Copy", desc: "A CTC-ready copy for banks or authorities.", icon: "ph:stamp-bold", tint: "bg-emerald-50 text-emerald-600", fields: r.ctc.questions, show: true },
    { key: "letterhead", title: "Letterhead", desc: "Format the output for company letterhead.", icon: "ph:file-text-bold", tint: "bg-blue-50 text-blue-600", fields: r.letterhead.questions, show: true },
  ]
    .filter((d) => d.show)
    .map((d) => ({ ...d, included: extraRefs[d.key].value }));
});

const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";
const showExtraErrors = ref(false);
const extraInvalid = (q) => showExtraErrors.value && q.required && isBlank(answers[q.field]);
const extraInputType = (q) => ({ date: "date", email: "email", phone: "tel" }[q.type] || "text");

function toggleDoc(key) {
  const on = !extraRefs[key].value;
  extraRefs[key].value = on;
  if (!on) return;
  // fill what we already know (e.g. from an earlier resolution this session) — never overwrite typing
  for (const q of extraDocs.value.find((d) => d.key === key)?.fields || []) {
    if (isBlank(answers[q.field]) && q.smartDefault && knownFacts[q.field] !== undefined) answers[q.field] = knownFacts[q.field];
  }
}

async function focusFirstMissingExtra() {
  showExtraErrors.value = true;
  await nextTick();
  const el = document.querySelector('[id^="opt-"][aria-invalid="true"]');
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }
}

// "Review compliance" never sits disabled without a reason: if details are missing, show and focus them.
function reviewCompliance() {
  if (finishingIssues.value.length) return focusFirstMissingExtra();
  return runComplianceCheck();
}

const finishingIssues = computed(() => {
  const issues = [];
  if (includeNotice.value) {
    for (const q of resolution.value.notice.questions) {
      if (q.required && isBlank(answers[q.field])) issues.push(`${q.label} is required for the Notice of Meeting.`);
    }
  }
  if (includeCtc.value) {
    for (const q of resolution.value.ctc.questions) {
      if (q.required && isBlank(answers[q.field])) issues.push(`${q.label} is required for the CTC.`);
    }
  }
  if (includeLetterhead.value) {
    for (const q of resolution.value.letterhead.questions) {
      if (q.required && isBlank(answers[q.field])) issues.push(`${q.label} is required for the letterhead.`);
    }
  }
  return issues;
});

watch(() => finishingIssues.value.length, (n) => { if (!n) showExtraErrors.value = false; });

const hasCritical = computed(() => compliance.value.some((r) => r.severity === "critical"));
const hasWarning = computed(() => compliance.value.some((r) => r.severity === "warning"));

// Pass / Information / Action-required display, shared with the generated page.
// Each action item gets a button labelled after the section that holds its fields.
const sectionLabelFor = (fields = []) => {
  const q = resolution.value?.questions.find((x) => fields.includes(x.field));
  return q ? `Review ${q.section.toLowerCase()}` : "Review details";
};
const complianceDisplay = computed(() =>
  resolution.value ? buildComplianceDisplay(resolution.value.complianceRules, compliance.value, sectionLabelFor) : []
);
const counts = computed(() => complianceCounts(complianceDisplay.value));

async function runComplianceCheck() {
  complianceLoading.value = true;
  try {
    const res = await $fetch("/api/resolutions/validate", { method: "POST", body: { slug: resolution.value.slug, answers } });
    compliance.value = res.compliance;
    complianceChecked.value = true;

    if (compliance.value.length) {
      try {
        const n = await $fetch("/api/ai/compliance-narrate", {
          method: "POST",
          body: { resolutionTitle: resolution.value.title, results: compliance.value },
        });
        // The non-AI fallback just repeats the cards above, so only show genuine AI text.
        narration.value = n.aiUsed ? n.narration : "";
      } catch {
        // ComplianceSummary already shows the raw rule messages
      }
    }
  } finally {
    complianceLoading.value = false;
  }
}

async function generate() {
  generating.value = true;
  generateError.value = null;
  try {
    result.value = await $fetch("/api/resolutions/generate", {
      method: "POST",
      body: {
        slug: resolution.value.slug,
        answers,
        includeNotice: includeNotice.value,
        includeCtc: includeCtc.value,
        includeLetterhead: includeLetterhead.value,
        acknowledgeWarnings: warningsAcknowledged.value,
      },
    });
    localStorage.removeItem(draftKey);
    savedAt.value = null;
    savedRefinedSnapshot.value = "";
    return true;
  } catch (error) {
    const data = error?.data?.data || {};
    // everything the server objected to: invalid/missing answers, and blocking compliance findings (with their own fix fields)
    const issues = [
      ...(data.inputIssues || []).filter((i) => i.severity === "critical").map((i) => ({ field: i.field, message: i.message })),
      ...(data.compliance || []).filter((c) => c.severity === "critical").map((c) => ({ field: c.fields?.[0], message: `${c.title}: ${c.detail || c.message}` })),
    ];
    generateError.value = {
      message: issues.length ? "We couldn't generate the resolution yet:" : error?.data?.statusMessage || "Could not generate the resolution.",
      issues,
    };
    // keep the screen honest: if the server found blocking findings, show them as the compliance result
    if (Array.isArray(data.compliance)) {
      compliance.value = data.compliance;
      complianceChecked.value = true;
    }
    return false;
  } finally {
    generating.value = false;
  }
}

async function startGenerate() {
  phase.value = "generating";
  generationStepIndex.value = 0;

  const stepTimer = setInterval(() => {
    if (generationStepIndex.value < generationSteps.length - 1) generationStepIndex.value += 1;
  }, 450);

  const [ok] = await Promise.all([generate(), new Promise((resolve) => setTimeout(resolve, 1200))]);
  clearInterval(stepTimer);

  if (ok) {
    generationStepIndex.value = generationSteps.length;
    await new Promise((resolve) => setTimeout(resolve, 300));
    phase.value = "generated";
  } else {
    phase.value = "review";
    // the review screen is mounted again only now, so this is when the error panel can be scrolled to
    await nextTick();
    setTimeout(() => {
      const panel = document.getElementById("generate-error");
      panel?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("compliance-panel")?.scrollTo?.({ top: 0 });
    }, 350);
  }
}

function applyEditedAnswers(updated) {
  Object.assign(answers, updated);
  showEditModal.value = false;
  // Edited values could change which compliance rules trigger, so route
  // back through the compliance check rather than regenerating blind.
  complianceChecked.value = false;
  compliance.value = [];
  narration.value = "";
  warningsAcknowledged.value = false;
  result.value = null;
  phase.value = "review";
}

async function refineWithAi({ style, instruction } = {}) {
  showRefineModal.value = false;
  refining.value = true;
  try {
    const res = await $fetch("/api/ai/refine-draft", {
      method: "POST",
      body: { resolutionTitle: result.value.title, draftText: refinedBody.value || result.value.document.body, style, instruction },
    });
    refinedBody.value = res.aiUsed ? res.refinedText : "";
    if (!res.aiUsed) saveMessage.value = "AI refinement isn't configured for this deployment yet.";
  } finally {
    refining.value = false;
  }
}

// PDF and Word both come from the server, typeset from the same document model as the on-screen
// preview: real text (selectable, searchable), A4, proper page breaks.
async function downloadFile(endpoint, filename) {
  saveMessage.value = "";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: resolution.value.slug,
        answers,
        includeNotice: includeNotice.value,
        includeCtc: includeCtc.value,
        includeLetterhead: includeLetterhead.value,
        acknowledgeWarnings: warningsAcknowledged.value,
        refinedBody: refinedBody.value,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.statusMessage || "Couldn't create the file.");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    saveError.value = true;
    saveMessage.value = error.message || "Couldn't create the file.";
  }
}
const downloadPdf = () => downloadFile("/api/resolutions/download-pdf", `${resolution.value.slug}.pdf`);
const downloadDocx = () => downloadFile("/api/resolutions/download-docx", `${resolution.value.slug}.docx`);

// Printing: copy just the document into #print-root and let the print stylesheet hide everything else.
// Done on beforeprint/afterprint so Ctrl+P produces the same pages as the Print button.
function mountPrintRoot() {
  const src = printRef.value?.querySelector(".doc-root");
  if (!src || document.getElementById("print-root")) return;
  const clone = src.cloneNode(true);
  clone.id = "print-root";
  document.body.appendChild(clone);
  document.documentElement.classList.add("printing");
}
function unmountPrintRoot() {
  document.getElementById("print-root")?.remove();
  document.documentElement.classList.remove("printing");
}
function printDocument() {
  window.print();
}
onMounted(() => {
  window.addEventListener("beforeprint", mountPrintRoot);
  window.addEventListener("afterprint", unmountPrintRoot);
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeprint", mountPrintRoot);
  window.removeEventListener("afterprint", unmountPrintRoot);
  unmountPrintRoot();
});

// Server text is plain; anything we put into stored HTML must be escaped.
const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function buildHistoryHtml() {
  const r = result.value;
  const block = (text) => `<div style="white-space:pre-line">${escapeHtml(text)}</div>`;
  return [
    r.notice ? `<h3>Notice of Meeting</h3>${block(r.notice)}` : "",
    r.letterhead ? block(r.letterhead) : "",
    `<h2>${escapeHtml(r.document.agendaTitle)}</h2>`,
    `<p><em>${escapeHtml(r.document.proposal)}</em></p>`,
    block(refinedBody.value || r.document.body),
    r.document.explanatoryStatement ? `<h3>Explanatory Statement</h3>${block(r.document.explanatoryStatement)}` : "",
    `<h3>Minutes — Gist of Discussion</h3>${block(r.document.minutesGist)}`,
    r.ctc ? `<h3>Certified True Copy</h3>${block(r.ctc)}` : "",
  ].join("\n");
}

async function saveToHistory() {
  if (!user.value) {
    showAuth.value = true;
    return;
  }
  saving.value = true;
  saveError.value = false;
  try {
    const contentHtml = buildHistoryHtml();
    const res = await $fetch("/api/resolutions/save-history", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: { userId: profile.value.id, title: result.value.title, slug: result.value.slug, contentHtml },
    });
    profile.value.credits = res.newBalance;
    savedAt.value = Date.now();
    savedRefinedSnapshot.value = refinedBody.value;
    saveMessage.value = "Saved to your account.";
  } catch (error) {
    saveError.value = true;
    saveMessage.value = error?.data?.statusMessage || "Couldn't save — check your credit balance.";
  } finally {
    saving.value = false;
  }
}

function reset() {
  localStorage.removeItem(draftKey);
  savedAt.value = null;
  savedRefinedSnapshot.value = "";
  returnToReview.value = false;
  phase.value = "intro";
  Object.keys(answers).forEach((k) => delete answers[k]);
  Object.keys(prefilledValues).forEach((k) => delete prefilledValues[k]);
  Object.keys(aiAppliedValues).forEach((k) => delete aiAppliedValues[k]);
  currentSectionIndex.value = 0;
  sectionAttempted.value = false;
  complianceChecked.value = false;
  compliance.value = [];
  warningsAcknowledged.value = false;
  result.value = null;
  refinedBody.value = "";
  includeNotice.value = false;
  includeCtc.value = false;
  includeLetterhead.value = false;
}
</script>

<style scoped>
.field-enter-active,
.field-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.field-enter-from,
.field-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
